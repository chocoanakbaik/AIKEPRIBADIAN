import os

import gradio as gr
from groq import Groq

MODEL_ID = os.getenv("GROQ_MODEL", "openai/gpt-oss-20b")

SYSTEM_PROMPT = """
Kamu adalah Choco AI, representasi digital dari Hasby Prasetya Saprudin, yang biasa dipanggil Choco.
Gunakan bahasa Indonesia santai dengan gaya gw-lu, jangan terlalu formal atau bertele-tele.
Jawab dengan sudut pandang orang pertama saat membicarakan karakter dan kebiasaan Choco, tetapi jangan mengaku sebagai manusia asli.
Jangan mengarang fakta tentang Hasby/Choco. Jika informasi belum tersedia, katakan bahwa kamu belum tahu.
Jaga informasi pribadi dan jangan mengungkap rahasia atau kredensial.
Kepribadian dan identitas yang lebih rinci akan ditambahkan bertahap dari data proyek.
""".strip()


def get_client():
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise gr.Error(
            "GROQ_API_KEY belum diatur. Tambahkan sebagai secret/environment variable "
            "di tempat aplikasi ini dijalankan."
        )
    return Groq(api_key=api_key)


def chat(message, history):
    client = get_client()
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]

    # Support format history Gradio berbentuk messages maupun pasangan tuple lama.
    for item in (history or []):
        if isinstance(item, dict):
            role = item.get("role")
            content = item.get("content")
            if role in ("user", "assistant") and isinstance(content, str) and content:
                messages.append({"role": role, "content": content})
        elif isinstance(item, (tuple, list)) and len(item) == 2:
            user_text, assistant_text = item
            if user_text:
                messages.append({"role": "user", "content": str(user_text)})
            if assistant_text:
                messages.append({"role": "assistant", "content": str(assistant_text)})

    messages.append({"role": "user", "content": message})

    try:
        result = client.chat.completions.create(
            model=MODEL_ID,
            messages=messages,
            max_completion_tokens=700,
        )
    except Exception as exc:
        # Do not print or expose the API key.
        raise gr.Error(f"Permintaan ke Groq gagal: {exc}") from None

    answer = result.choices[0].message.content
    return answer or "model mengembalikan jawaban kosong."


demo = gr.ChatInterface(
    fn=chat,
    title="Choco AI",
    description=(
        "Representasi digital Hasby Prasetya Saprudin (Choco). "
        "Versi awal menggunakan Groq API; personality dan knowledge akan dilengkapi bertahap."
    ),
    examples=[
        "Lu itu siapa sih sebenernya?",
        "Gimana cara lu ngambil keputusan?",
        "Kalo lagi emosi, lu biasanya ngapain?",
        "Menurut lu korupsi itu gimana?",
    ],
)


if __name__ == "__main__":
    demo.launch()
