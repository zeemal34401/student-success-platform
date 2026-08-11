FROM python:3.12-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .
WORKDIR /app/src

EXPOSE 8002
CMD ["uvicorn", "api:app", "--host", "0.0.0.0", "--port", "8002"]
