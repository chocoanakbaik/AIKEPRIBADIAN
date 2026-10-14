from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="Choco AI Backend",
    description="Backend API untuk proyek AIKEPRIBADIAN.",
    version="0.1.0",
)

# Untuk tahap awal, izinkan frontend lokal dan domain Vercel.
# Daftar origin bisa dipersempit setelah alamat frontend sudah tetap.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {
        "app": "Choco AI Backend",
        "status": "running",
        "message": "Backend aktif.",
    }


@app.get("/health")
def health_check():
    return {"status": "ok"}
