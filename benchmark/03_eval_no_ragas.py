import os
import time
import requests
import json
import asyncio
import pandas as pd
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI
from pydantic import BaseModel, Field

import warnings
warnings.filterwarnings("ignore")

load_dotenv()

# Вкажіть правильний URL до вашого бекенду
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

    async def context_precision(self, question: str, contexts: list) -> float:
        if not contexts: return 0.0
        prompt = f"""
        You are an expert AI evaluator. Evaluate 'Context Precision'.
        Question: {question}
        Contexts: {" ".join(contexts)}
        Are these contexts highly relevant and useful for answering the question?
        Return a score from 0.0 (irrelevant) to 1.0 (highly relevant).
        """
        return await self.safe_ainvoke(prompt)

    async def context_recall(self, ground_truth: str, contexts: list) -> float:
        if not contexts or not ground_truth: return 0.0
        prompt = f"""
        You are an expert AI evaluator. Evaluate 'Context Recall'.
        Ground Truth: {ground_truth}
        Contexts: {" ".join(contexts)}
        Can the Ground Truth be fully derived from the provided Contexts?
        Return a score from 0.0 (ground truth not found in contexts) to 1.0 (ground truth fully supported by contexts).
        """
        return await self.safe_ainvoke(prompt)


# --- Main Evaluation Logic ---
async def run_evaluation(
    df_testset: pd.DataFrame,
    use_hybrid_search: bool,
    rewrite: bool,
    evaluator: CustomEvaluator,
    faithfulness: bool = True,
    relevancy: bool = True,
    precision: bool = True,
    recall: bool = True
) -> pd.DataFrame:
    print(f"\n[{time.strftime('%H:%M:%S')}] --- Running Evaluation: hybrid={use_hybrid_search}, rewrite={rewrite} ---")
    
    results = []
    total_questions = len(df_testset)
    
    for i, row in df_testset.iterrows():
        question = row['question']
        ground_truth = row['ground_truth']
        question_label = row.get('question_label', 'unknown')
        
        payload = {
            "query": question,
            "temperature": 0.0,
            "enable_thinking": False,
            "use_hybrid_search": use_hybrid_search,
            "rewrite": rewrite,
            "uncensored": False,
            "additional_questions": False
        }
        
        print(f"  [{i+1}/{total_questions}] Requesting: {question[:50]}...")
        start_time = time.time()
        answer = ""
        retrieved_contexts = []
        ttft = None
        
        try:
            resp = requests.post(API_URL, json=payload, stream=True, timeout=120)
            resp.raise_for_status()
            
            answer_parts = []
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
                            elif c_type == "answer":
                                if ttft is None:
                                    ttft = time.time() - start_time
                                answer_parts.append(chunk.get("text", ""))
                            elif c_type == "error":
                                print(f"      [Backend Error] {chunk.get('data', 'Unknown error')}")
                        except json.JSONDecodeError:
                            pass
            
            answer = "".join(answer_parts)
            
        except Exception as e:
            print(f"      [Connection Error] Failed to query backend: {e}")
            
        end_time = time.time()
        response_time = end_time - start_time
        
        # Обчислення метрик паралельно
        print(f"      Evaluating metrics...")
        tasks = {}
        if faithfulness:
            tasks["faithfulness"] = evaluator.faithfulness(answer, retrieved_contexts)
        if relevancy:
            tasks["answer_relevancy"] = evaluator.answer_relevancy(question, answer)
        if precision:
            tasks["context_precision"] = evaluator.context_precision(question, retrieved_contexts)
        if recall:
            tasks["context_recall"] = evaluator.context_recall(ground_truth, retrieved_contexts)
            
        eval_scores = {}
        if tasks:
            keys = list(tasks.keys())
            coroutines = list(tasks.values())
            scores = await asyncio.gather(*coroutines)
            eval_scores = dict(zip(keys, scores))
            
        f_score = eval_scores.get("faithfulness", float('nan'))
        ar_score = eval_scores.get("answer_relevancy", float('nan'))
        cp_score = eval_scores.get("context_precision", float('nan'))
        cr_score = eval_scores.get("context_recall", float('nan'))
        
        results.append({
            "question": question,
            "ground_truth": ground_truth,
            "question_label": question_label,
            "answer": answer,
            "contexts": retrieved_contexts,
            "response_time": response_time,
            "ttft": ttft if ttft is not None else float('nan'),
            "faithfulness": f_score,
            "answer_relevancy": ar_score,
            "context_precision": cp_score,
            "context_recall": cr_score
        })
        
        # Затримка між питаннями, щоб не перевантажувати LLM
        await asyncio.sleep(1)
        
    return pd.DataFrame(results)


async def main():
    testset_path = "data/output/testset.csv"
    # if not os.path.exists(testset_path):
    #     # Fallback to the main testset if mini is absent
    #     testset_path = "data/output/testset.csv"
        
    if not os.path.exists(testset_path):
        print(f"Error: Testset not found at {testset_path}")
        return
        
    print(f"Loading testset from {testset_path}...")
    df_testset = pd.read_csv(testset_path).dropna(subset=['question', 'ground_truth'])
    
    print("Initializing Custom Evaluator (No Ragas)...")
    evaluator = CustomEvaluator()
    
    configs = [
        {"use_hybrid_search": True, "rewrite": True},
        {"use_hybrid_search": True, "rewrite": False},
        {"use_hybrid_search": False, "rewrite": True},
        {"use_hybrid_search": False, "rewrite": False},
    ]
    
    summary_data = []
    os.makedirs("data/output", exist_ok=True)
    
    for conf in configs:
        hybrid = conf["use_hybrid_search"]
        rewrite = conf["rewrite"]
        config_name = f"hybrid_{hybrid}_rewrite_{rewrite}"
        
        df_detailed = await run_evaluation(df_testset, hybrid, rewrite, evaluator)
        
        # Збереження детального результату
        out_path = f"data/output/{config_name}_detailed.csv"
        df_detailed.to_csv(out_path, index=False)
        print(f"Saved detailed results for {config_name} to {out_path}")
        
        # Розрахунок середніх значень (summary)
        numeric_cols = df_detailed.select_dtypes(include=['number']).columns
        means = df_detailed[numeric_cols].mean().to_dict()
        
        summary_row = {
            "use_hybrid_search": hybrid,
            "rewrite": rewrite,
            "avg_response_time": means.get("response_time", 0.0),
            "avg_ttft": means.get("ttft", 0.0),
            "faithfulness": means.get("faithfulness", float('nan')),
            "answer_relevancy": means.get("answer_relevancy", float('nan')),
            "context_precision": means.get("context_precision", float('nan')),
            "context_recall": means.get("context_recall", float('nan'))
        }
        
        summary_data.append(summary_row)
        
    # Фінальне збереження зведеної таблиці
    df_summary = pd.DataFrame(summary_data)
    summary_path = "data/output/ablation_summary.csv"
    df_summary.to_csv(summary_path, index=False)
    
    print(f"\n[{time.strftime('%H:%M:%S')}] All evaluations complete!")
    print(f"Summary saved to {summary_path}")
    print("\n--- Ablation Study Summary ---")
    print(df_summary.to_string(index=False))


if __name__ == "__main__":
    asyncio.run(main())