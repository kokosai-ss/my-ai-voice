import asyncio
from flask import Flask, render_template_string, request, send_file
import edge_tts
import os

app = Flask(__name__)

HTML_TEMPLATE = """
<!DOCTYPE html>
<html lang="my">
<head>
    <meta charset="UTF-8">
    <title>Thiha & Nilar Voice Test</title>
    <style>
        body { background: #01050F; color: #fff; font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
        .card { background: rgba(255,255,255,0.05); padding: 20px; border-radius: 12px; border: 1px solid #00d2ff; width: 350px; }
        textarea, select, button { width: 100%; margin-top: 10px; padding: 10px; border-radius: 6px; border: none; box-sizing: border-box; }
        textarea { background: #0a1128; color: #fff; resize: none; height: 80px; }
        select { background: #0a1128; color: #fff; }
        button { background: #00d2ff; color: #01050F; font-weight: bold; cursor: pointer; }
    </style>
</head>
<body>
    <div class="card">
        <h3>🎙️ Free Voice Test</h3>
        <label>စာသားထည့်ရန်:</label>
        <textarea id="textInput">မင်္ဂလာပါ၊ သီဟနဲ့ နီလာ အသံစမ်းသပ်ချက် ဖြစ်ပါတယ်။</textarea>
        
        <label>အသံရွေးရန်:</label>
        <select id="voiceSelect">
            <option value="my-MM-ThihaNeural">ကိုသီဟ (Thiha - Male)</option>
            <option value="my-MM-NilarNeural">မနီလာ (Nilar - Female)</option>
        </select>

        <button onclick="generateVoice()">အသံထုတ်မည်</button>
        
        <audio id="audioPlayer" controls style="width: 100%; margin-top: 15px; display: none;"></audio>
    </div>

    <script>
        async function generateVoice() {
            const text = document.getElementById('textInput').value;
            const voice = document.getElementById('voiceSelect').value;
            
            alert("အသံထုတ်နေပါပြီ...");
            
            const response = await fetch('/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: text, voice: voice })
            });

            if(response.ok) {
                const blob = await response.blob();
                const audioUrl = URL.createObjectURL(blob);
                const player = document.getElementById('audioPlayer');
                player.src = audioUrl;
                player.style.display = 'block';
                player.play();
            } else {
                alert("အသံထုတ်လို့ မအောင်မြင်ပါဘူး။");
            }
        }
    </script>
</body>
</html>
"""

@app.route('/')
def index():
    return render_template_string(HTML_TEMPLATE)

@app.route('/generate', methods=['POST'])
def generate():
    data = request.json
    text = data.get('text')
    voice = data.get('voice')
    output_file = "output.mp3"

    async def create_audio():
        communicate = edge_tts.Communicate(text, voice)
        await communicate.save(output_file)

    asyncio.run(create_audio())
    return send_file(output_file, mimetype="audio/mp3")

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=7860)
