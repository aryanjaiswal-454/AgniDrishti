FROM python:3.12-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    libgdal-dev \
    && rm -rf /var/lib/apt/lists/*

# Set up Python env
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PYTHONPATH=/app/track_a/a4:$PYTHONPATH

# Install requirements
COPY Development/apps/classifier/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source properly
COPY apps/classifier/ .
COPY track_a/ ./track_a/
COPY data/ ./data/
# Note: /app/data mapping happens at runtime via volumes in docker-compose.

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
