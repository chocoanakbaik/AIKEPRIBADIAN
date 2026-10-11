import os

import gradio as gr
import spaces
import torch
from peft import PeftModel
from transformers import AutoModelForCausalLM, AutoTokenizer

BASE_MODEL = "Qwen/Qwen2.5-3B-Instruct"

# Cari folder LoRA: bisa di root Space, atau di folder choco_lora_final
HERE = os.path.dirname(os.path.abspath(__file__))
if os.path.exists(os.path.join(HERE, "adapter_config.json")):
    ADAPTER_DIR = HERE
else:
    ADAPTER_DIR = os.path.join(HERE, "choco_lora_final")

SYSTEM_PROMPT = (
    "Kamu adalah Choco AI, representasi digital Hasby Prasetya Saprudin (Choco). "
    "Jawab dengan sudut pandang orang pertama memakai 'gw' dan gaya santai Hasby. "
    "Jangan mengaku sebagai manusia asli dan jangan mengarang fakta. "
    "Kalau datanya belum ada, bilang jujur belum tau. Jangan bocorin informasi pribadi."
)

# --- Load model sekali saat Space nyala ---
tokenizer = AutoTokenizer.from_pretrained(BASE_MODEL)

model = AutoModelForCausalLM.from_pretrained(
    BASE_MODEL,
    torch_dtype=torch.float16,
    device_map="cpu",
)
# torch_device="cpu" biar adapter gk dibaca ke CUDA saat startup (ZeroGPU)
model = PeftModel.from_pretrained(model, ADAPTER_DIR, torch_device="cpu")
model = model.merge_and_unload()
model.eval()


@spaces.GPU(duration=60)
def generate(message):
    model.to("cuda")

    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": message},
    ]

    text = tokenizer.apply_chat_template(
        messages,
        tokenize=False,
        add_generation_prompt=True,
    )
    encoded = tokenizer(text, return_tensors="pt").to("cuda")

    with torch.no_grad():
        output = model.generate(
            **encoded,
            max_new_tokens=120,
            do_sample=False,
        )

    new_tokens = output[0][encoded["input_ids"].shape[1]:]
    jawaban = tokenizer.decode(new_tokens, skip_special_tokens=True).strip()

    model.to("cpu")
    return jawaban


def chat(message, history):
    # Choco AI dilatih untuk satu pertanyaan per jawaban, jadi riwayat chat tidak dipakai
    return generate(message)


demo = gr.ChatInterface(
    fn=chat,
    title="Choco AI",
    description=(
        "Representasi digital Hasby Prasetya Saprudin (Choco). "
        "Ini masih versi uji coba, jawabannya bisa meleset. "
        "Satu pertanyaan per kali kirim ya."
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
