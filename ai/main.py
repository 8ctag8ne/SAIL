from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def root():
    return {"message": "Я не можу здійснювати розумову діяльність бо в мене немає повноважень та відповідного наказу."}

@app.get("/hello")
def say_hello():
    return {"message": "Hello there!"}