FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Set work directory
WORKDIR /app

RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
# Copy project
COPY . /app/

# Create directories for static files and media
RUN mkdir -p /app/staticfiles /app/media /app/logs

# Set permissions
RUN chmod +x /app/manage.py

# Expose port
EXPOSE 8001

# Default command
CMD ["python", "manage.py", "runserver", "0.0.0.0:8001"]