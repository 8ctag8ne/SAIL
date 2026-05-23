import os
import time
import requests
import json
import asyncio
import argparse
import pandas as pd
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI
from pydantic import BaseModel, Field

import warnings
warnings.filterwarnings("ignore")

load_dotenv()

API_URL = "http://0.0.0.0:8000/rag/ask"

# --- Custom Evaluator (LLM-as-a-judge замість RAGAS) ---
class MetricScore(BaseModel):
    score: float = Field(description="A score between 0.0 and 1.0 representing the metric.")

class CustomEvaluator:
    def __init__(self):
        # Ініціалізуємо Gemini для оцінки
        self.llm = ChatGoogleGenerativeAI(model="gemini-3.5-flash", temperature=0, max_retries=10)
        self.structured_llm = self.llm.with_structured_output(MetricScore)
        
    async def safe_ainvoke(self, prompt: str) -> float:
        try:
            res = await self.structured_llm.ainvoke(prompt)
            # Переконуємося, що оцінка в межах 0..1
            return max(0.0, min(1.0, float(res.score)))
        except Exception as e:
            print(f"      [Eval Warning] Failed to parse score: {e}")
            return 0.0

    async def faithfulness(self, answer: str, contexts: list) -> float:
        if not answer or not contexts: return 0.0
        prompt = f"""
        You are an expert AI evaluator. Evaluate 'Faithfulness'.
        Given the Context and the Answer, determine if the Answer is factually derived strictly from the Context.
        Context: {" ".join(contexts)}
        Answer: {answer}
        Return a score from 0.0 (completely hallucinated/unsupported) to 1.0 (completely supported by context).
        """
        return await self.safe_ainvoke(prompt)

    async def answer_relevancy(self, question: str, answer: str) -> float:
        if not answer: return 0.0
        prompt = f"""
        You are an expert AI evaluator. Evaluate 'Answer Relevancy'.
        Question: {question}
        Answer: {answer}
        Does the answer address the question directly and effectively?
        Don't decrease the score if the answer is broader than the question or contains additional useful context on the topic, compared to the expected short fact. The main criterion is whether the answer directly and accurately answers the question.
        Return a score from 0.0 (completely irrelevant) to 1.0 (highly relevant and direct).
        """
        return await self.safe_ainvoke(prompt)

def estimate_token_count(text: str) -> int:
    if not text:
        return 0
    try:
        import tiktoken
        encoding = tiktoken.get_encoding("cl100k_base")
        return len(encoding.encode(text))
    except Exception:
        # Fallback heuristic: ~3.3 characters per token for Cyrillic/Ukrainian text
        return int(len(text) / 3.3)

async def run_model_evaluation(
    df_testset: pd.DataFrame,
    run_name: str,
    use_hybrid_search: bool,
    rewrite: bool,
    enable_thinking: bool,
    evaluator: CustomEvaluator
) -> pd.DataFrame:
    print(f"\n[{time.strftime('%H:%M:%S')}] --- Starting Model Evaluation for '{run_name}' ---")
    print(f"Configuration: hybrid_search={use_hybrid_search}, query_rewrite={rewrite}, enable_thinking={enable_thinking}")
    
    results = []
    total_questions = len(df_testset)
    
    for i, row in df_testset.iterrows():
        question = row['question']
        ground_truth = row['ground_truth']
        question_label = row.get('question_label', 'unknown')
        
        payload = {
            "query": question,
            "temperature": 0.0,
            "enable_thinking": enable_thinking,
            "use_hybrid_search": use_hybrid_search,
            "rewrite": rewrite,
            "uncensored": False,
            "additional_questions": False
        }
        
        print(f"  [{i+1}/{total_questions}] Requesting: {question[:50]}...")
        start_time = time.time()
        answer = ""
        thinking = ""
        retrieved_contexts = []
        ttft = None
        ttft_answer = None
        
        try:
            resp = requests.post(API_URL, json=payload, stream=True, timeout=120)
            resp.raise_for_status()
            
            answer_parts = []
            thinking_parts = []
            for line in resp.iter_lines():
                if line:
                    decoded = line.decode('utf-8')
                    if decoded.startswith("data: "):
                        data_str = decoded[6:]
                        if data_str == "[DONE]":
                            break
                        try:
                            chunk = json.loads(data_str)
                            c_type = chunk.get("type")
                            if c_type == "sources":
                                retrieved_contexts = [src.get("text", "") for src in chunk.get("data", [])]
                            elif c_type == "thinking":
                                if ttft is None:
                                    ttft = time.time() - start_time
                                thinking_parts.append(chunk.get("text", ""))
                            elif c_type == "answer":
                                if ttft is None:
                                    ttft = time.time() - start_time
                                if ttft_answer is None:
                                    ttft_answer = time.time() - start_time
                                answer_parts.append(chunk.get("text", ""))
                            elif c_type == "error":
                                print(f"      [Backend Error] {chunk.get('data', 'Unknown error')}")
                        except json.JSONDecodeError:
                            pass
            
            answer = "".join(answer_parts)
            thinking = "".join(thinking_parts)
            
        except Exception as e:
            print(f"      [Connection Error] Failed to query backend: {e}")
            
        end_time = time.time()
        response_time = end_time - start_time
        
        # Calculate tokens
        answer_tokens = estimate_token_count(answer)
        thinking_tokens = estimate_token_count(thinking)
        total_tokens = answer_tokens + thinking_tokens
        
        # Calculate speeds (Tokens/sec)
        # 1. Answer generation speed (from first answer token to response end)
        answer_gen_time = response_time - ttft_answer if (ttft_answer is not None and response_time > ttft_answer) else response_time
        tokens_per_second = answer_tokens / answer_gen_time if answer_gen_time > 0 else 0.0
        
        # 2. Thinking generation speed (from first token of any type to first answer token)
        thinking_gen_time = ttft_answer - ttft if (ttft_answer is not None and ttft is not None and ttft_answer > ttft) else 0.0
        thinking_tokens_per_second = thinking_tokens / thinking_gen_time if thinking_gen_time > 0 else 0.0
        
        # 3. Total stream generation speed (from first token of any type to response end)
        total_gen_time = response_time - ttft if (ttft is not None and response_time > ttft) else response_time
        total_tokens_per_second = total_tokens / total_gen_time if total_gen_time > 0 else 0.0
        
        # Evaluate metrics in parallel (only Faithfulness and Relevancy) using clean answer
        print(f"      Evaluating metrics (Faithfulness & Relevancy)...")
        tasks = {
            "faithfulness": evaluator.faithfulness(answer, retrieved_contexts),
            "answer_relevancy": evaluator.answer_relevancy(question, answer)
        }
        
        keys = list(tasks.keys())
        coroutines = list(tasks.values())
        scores = await asyncio.gather(*coroutines)
        eval_scores = dict(zip(keys, scores))
        
        f_score = eval_scores.get("faithfulness", 0.0)
        ar_score = eval_scores.get("answer_relevancy", 0.0)
        
        print(f"      Metrics results -> Faithfulness: {f_score:.4f} | Relevancy: {ar_score:.4f} | TTFT: {ttft if ttft is not None else 0.0:.4f}s | TTFT Answer: {ttft_answer if ttft_answer is not None else 0.0:.4f}s | Answer Tokens/sec: {tokens_per_second:.2f}")
        
        results.append({
            "question": question,
            "ground_truth": ground_truth,
            "question_label": question_label,
            "answer": answer,
            "thinking": thinking,
            "contexts": retrieved_contexts,
            "response_time": response_time,
            "ttft": ttft if ttft is not None else float('nan'),
            "ttft_answer": ttft_answer if ttft_answer is not None else float('nan'),
            "answer_tokens": answer_tokens,
            "thinking_tokens": thinking_tokens,
            "total_tokens": total_tokens,
            "tokens_per_second": tokens_per_second,
            "thinking_tokens_per_second": thinking_tokens_per_second,
            "total_tokens_per_second": total_tokens_per_second,
            "faithfulness": f_score,
            "answer_relevancy": ar_score
        })
        
        # Delay to avoid rate limits
        await asyncio.sleep(1)
        
    return pd.DataFrame(results)

async def main():
    parser = argparse.ArgumentParser(description="Evaluate a specific model config on Faithfulness, Relevancy, TTFT, and speed metrics.")
    parser.add_argument("--name", type=str, required=True, help="Name of the model/run configuration (e.g. gemini-1.5-flash, llama-3-70b)")
    parser.add_argument("--hybrid", action="store_true", default=True, help="Use hybrid search (default: True)")
    parser.add_argument("--no-hybrid", action="store_false", dest="hybrid", help="Disable hybrid search")
    parser.add_argument("--rewrite", action="store_true", default=False, help="Rewrite the query (default: False)")
    parser.add_argument("--thinking", action="store_true", default=False, help="Enable thinking mode in the backend payload")
    parser.add_argument("--testset", type=str, default="data/output/testset.csv", help="Path to the testset CSV (default: data/output/testset.csv)")
    
    args = parser.parse_args()
    
    run_name = args.name
    testset_path = args.testset
    hybrid = args.hybrid
    rewrite = args.rewrite
    thinking_enabled = args.thinking
    
    if not os.path.exists(testset_path):
        print(f"Error: Testset not found at {testset_path}")
        return
        
    print(f"Loading testset from {testset_path}...")
    df_testset = pd.read_csv(testset_path).dropna(subset=['question', 'ground_truth'])
    
    print("Initializing Custom Evaluator...")
    evaluator = CustomEvaluator()
    
    df_detailed = await run_model_evaluation(df_testset, run_name, hybrid, rewrite, thinking_enabled, evaluator)
    
    # Save detailed results
    os.makedirs("data/output", exist_ok=True)
    detailed_path = f"data/output/{run_name}_detailed.csv"
    df_detailed.to_csv(detailed_path, index=False)
    print(f"\nSaved detailed results to {detailed_path}")
    
    # Calculate averages
    numeric_cols = df_detailed.select_dtypes(include=['number']).columns
    means = df_detailed[numeric_cols].mean().to_dict()
    
    summary_row = {
        "run_name": run_name,
        "samples_evaluated": len(df_detailed),
        "use_hybrid_search": hybrid,
        "rewrite": rewrite,
        "enable_thinking": thinking_enabled,
        "avg_response_time": means.get("response_time", 0.0),
        "avg_ttft": means.get("ttft", 0.0),
        "avg_ttft_answer": means.get("ttft_answer", 0.0),
        "avg_answer_tokens": means.get("answer_tokens", 0.0),
        "avg_thinking_tokens": means.get("thinking_tokens", 0.0),
        "avg_tokens_per_second": means.get("tokens_per_second", 0.0),
        "avg_total_tokens_per_second": means.get("total_tokens_per_second", 0.0),
        "faithfulness": means.get("faithfulness", 0.0),
        "answer_relevancy": means.get("answer_relevancy", 0.0)
    }
    
    df_summary = pd.DataFrame([summary_row])
    summary_path = f"data/output/{run_name}_summary.csv"
    df_summary.to_csv(summary_path, index=False)
    print(f"Saved summary results to {summary_path}")
    
    print(f"\n[{time.strftime('%H:%M:%S')}] Evaluation complete for run: {run_name}")
    print("\n--- Model Benchmark Summary ---")
    print(df_summary.to_string(index=False))

if __name__ == "__main__":
    asyncio.run(main())
