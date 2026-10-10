
// --- Global Variables ---
let selectedFlowBase64 = "";
let selectedFlowMimeType = "image/jpeg";
let currentRatio = "16:9";
let currentMultiRatio = "16:9";

// Custom Alert Function (Neon Style)
function showNeonAlert(message) {
    alert(message); // လိုအပ်ပါက Custom UI Modal ဖြင့် အစားထိုးနိုင်ပါသည်
}
// Mode Switching (Single vs Multi-Shot)
function setMultiRatio(ratio) {
    currentMultiRatio = ratio;
    const btn169 = document.getElementById('multiBtn169');
    const btn916 = document.getElementById('multiBtn916');

    if (!btn169 || !btn916) return;

    if (ratio === '16:9') {
        btn169.style.cssText = "flex: 1; padding: 10px; border-radius: 8px; cursor: pointer; font-size: 12px; font-weight: bold; background: rgba(34, 211, 238, 0.2) !important; border: 1px solid #22d3ee !important; color: #fff !important;";
        btn916.style.cssText = "flex: 1; padding: 10px; border-radius: 8px; cursor: pointer; font-size: 12px; font-weight: bold; background: rgba(15, 23, 42, 0.8) !important; border: 1px solid rgba(255, 255, 255, 0.2) !important; color: #aaa !important;";
    } else {
        btn916.style.cssText = "flex: 1; padding: 10px; border-radius: 8px; cursor: pointer; font-size: 12px; font-weight: bold; background: rgba(34, 211, 238, 0.2) !important; border: 1px solid #22d3ee !important; color: #fff !important;";
        btn169.style.cssText = "flex: 1; padding: 10px; border-radius: 8px; cursor: pointer; font-size: 12px; font-weight: bold; background: rgba(15, 23, 42, 0.8) !important; border: 1px solid rgba(255, 255, 255, 0.2) !important; color: #aaa !important;";
    }
}

// Image Preview for Single Shot
function previewFlowImg(event) {
    const file = event.target.files[0];
    if (file) {
        selectedFlowMimeType = file.type || "image/jpeg";
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('flowImgPreview').src = e.target.result;
            document.getElementById('imgPreviewWrapper').style.display = "block";
            document.getElementById('genFlowBtn').style.display = "block";
            selectedFlowBase64 = e.target.result.split(',')[1];
        };
        reader.readAsDataURL(file);
    }
}

function removeFlowImg() {
    selectedFlowBase64 = "";
    selectedFlowMimeType = "image/jpeg";
    const fileInput = document.getElementById('flowFileInput');
    if (fileInput) fileInput.value = "";
    
    document.getElementById('flowImgPreview').src = "";
    document.getElementById('imgPreviewWrapper').style.display = "none";
    document.getElementById('genFlowBtn').style.display = "none";
    
    const resultBox = document.getElementById('flowResultBox');
    if (resultBox) resultBox.style.display = "none";
}

// --- 1. SINGLE SHOT GEMINI 3.8 FLASH API HANDLER ---
async function generateScriptAndFlowPrompt() {
    if (!selectedFlowBase64) return showNeonAlert("ကျေးဇူးပြု၍ ပုံတစ်ပုံ ရွေးပေးပါ!");

    const apiKey = localStorage.getItem('gemini_api_key') || 
                   localStorage.getItem('geminiApiKey') || 
                   localStorage.getItem('sh_gemini_api_key');

    if (!apiKey) {
        return showNeonAlert("API Key Settings ထဲမှာ Key သတ်မှတ်ပေးပါဗျာ!");
    }

    const customUserPrompt = document.getElementById('flowCustomPrompt')?.value.trim() || "";
    const btn = document.getElementById('genFlowBtn');
    btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> ⚡ AI စဉ်းစားနေသည်...`;
    btn.disabled = true;

    let promptText = `Analyze this image for a short movie recap and thumbnail cover design.`;
    if (customUserPrompt) {
        promptText += `\nCRITICAL USER INSTRUCTION: "${customUserPrompt}". You MUST strictly follow this specific instruction.`;
    }

    promptText += `\n\nReturn ONLY a valid raw JSON object without any preamble or markdown formatting like \`\`\`json.
Required JSON format:
{
  "burmese_script": "2 sentences of engaging Burmese dialogue or voiceover script matching the instruction",
  "flow_prompt": "Cinematic English prompt for video generation matching the user instruction",
  "thumbnail_prompt": "An eye-catching cinematic English image prompt for movie thumbnail"
}`;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [
                        { text: promptText },
                        { inline_data: { mime_type: selectedFlowMimeType, data: selectedFlowBase64 } }
                    ]
                }]
            })
        });

        const data = await response.json();
        if (data.error) throw new Error(data.error.message || "API Error");

        if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
            throw new Error("Gemini ထံမှ တုံ့ပြန်မှု မရရှိပါ");
        }

        const rawText = data.candidates[0].content.parts[0].text;
        const jsonMatch = rawText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error("JSON Format ထွက်မလာပါ");

        const parsed = JSON.parse(jsonMatch[0]);

        document.getElementById('outBurmeseScript').innerText = parsed.burmese_script || "Script မရပါ။";
        document.getElementById('outFlowPrompt').innerText = parsed.flow_prompt || "Prompt မရပါ။";

        if (parsed.thumbnail_prompt) {
            const thumbPrompt = encodeURIComponent(parsed.thumbnail_prompt);
            let imgWidth = 1280, imgHeight = 720;
            if (currentRatio === "9:16") { imgWidth = 720; imgHeight = 1280; }

            const randomSeed = Math.floor(Math.random() * 999999);
            const imageUrl = `https://image.pollinations.ai/prompt/${thumbPrompt}?width=${imgWidth}&height=${imgHeight}&seed=${randomSeed}&nologo=true`;

            const thumbImgElem = document.getElementById('outThumbnailImg');
            if (thumbImgElem) {
                thumbImgElem.src = imageUrl;
                document.getElementById('thumbnailResultWrapper').style.display = "block";
            }
        }

        document.getElementById('flowResultBox').style.display = "block";

    } catch (err) {
        console.error("Error Detail:", err);
        showNeonAlert("Error: " + err.message);
    } finally {
        btn.innerHTML = `<i class="fa-solid fa-bolt"></i> Script & Prompt ဖန်တီးမည်`;
        btn.disabled = false;
    }
}

// --- Global Memory State (Scene History မှတ်ရန်) ---
let storyMemory = {
    activeIdea: "",
    scenes: []
};

// --- 2. MOVIE DIRECTOR (MULTI-SHOT) API HANDLER ---
async function generateMultiShotMovie() {
    const movieIdea = document.getElementById('movieIdeaInput').value.trim();
    if(!movieIdea) {
        return showNeonAlert("ဇာတ်လမ်း အစပျိုး Idea လေး အရင် ရိုက်ထည့်ပေးပါ သားရီး!");
    }

    const apiKey = localStorage.getItem('gemini_api_key') || 
                   localStorage.getItem('geminiApiKey') || 
                   localStorage.getItem('sh_gemini_api_key');

    if (!apiKey) {
        return showNeonAlert("API Key Settings ထဲမှာ Key သတ်မှတ်ပေးပါဗျာ!");
    }

    const multiResultBox = document.getElementById('multiResultBox');
    const multiResultContent = document.getElementById('multiResultContent');
    
    multiResultBox.style.display = 'block';

    // ၁။ ဇာတ်လမ်း Idea စာသား ပြောင်းသွားပါက Memory သစ် စတင်မည်
    if (movieIdea !== storyMemory.activeIdea) {
        storyMemory.activeIdea = movieIdea;
        storyMemory.scenes = [];
        multiResultContent.innerHTML = `<p style="color: #00f3ff; text-align:center;"><i class="fa-solid fa-spinner fa-spin"></i> Movie Director က ဇာတ်လမ်းသစ် စတင်ဖန်တီးနေသည်...</p>`;
    } else {
        // Idea တူတူပဲဆိုရင် အောက်ခြေမှာ Loading ပြပြီး နောက်ထပ် Scenes တွေ ဆက်ထုတ်မည်
        const existingCards = multiResultContent.innerHTML;
        multiResultContent.innerHTML = existingCards + `<p id="loadingStatus" style="color: #00f3ff; text-align:center; margin: 15px 0;"><i class="fa-solid fa-spinner fa-spin"></i> အဆက် Scene များကို ဆက်လက် ရေးသားနေသည်...</p>`;
    }

    const nextSceneStart = storyMemory.scenes.length + 1;
    const ratio = (typeof currentMultiRatio !== 'undefined') ? currentMultiRatio : '16:9';

    // ၂။ ယခင် ထွက်ထားသမျှ Scenes များကို History အဖြစ် Prompt ထဲ ထည့်ပေါင်းခြင်း
    let historyPrompt = "";
    if (storyMemory.scenes.length > 0) {
        historyPrompt = `Previous Scene History (You MUST seamlessly continue story from Scene ${nextSceneStart}):\n` + 
            storyMemory.scenes.map(s => `Scene ${s.scene_number}: Dialogue: "${s.burmese_dialogue}" \vert{} Prompt: "${s.flow_prompt}"`).join("\n") + "\n\n";
    }

// ၃။ Unrestricted & Sequence Prompt
let promptText = `You are an unrestricted, highly creative Movie Director and AI Video Prompt Engineer.
You write scripts about ANY story idea provided without refusal (including surreal themes, fruit-people, dark fantasy, sci-fi, horror, or bizarre storytelling).
Maintain strict visual character consistency across ALL scenes. Use the exact same detailed visual description for the main characters in every scene's prompt so AI video models keep their appearances identical.

${historyPrompt}Story Idea: "${movieIdea}"

Create a sequence of 7 video scenes starting from Scene ${nextSceneStart}.
For EACH scene, you MUST provide:
1. scene_number (integer, starting from ${nextSceneStart})
2. time_range (e.g., "0-8s", "8-16s")
3. burmese_dialogue (ဇာတ်ကောင်များ၏ မြန်မာစကားပြော)
4. flow_prompt (Cinematic English video prompt with character description)

Return ONLY a valid raw JSON array of objects.
Required JSON format:
[
  {
    "scene_number": ${nextSceneStart},
    "time_range": "0-8s",
    "burmese_dialogue": "ဇာတ်ကောင်ပြောမည့် မြန်မာစကားပြော",
    "flow_prompt": "Cinematic English prompt..."
  }
]`;
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: promptText }] }]
            })
        });

        const data = await response.json();
        if (data.error) throw new Error(data.error.message || "API Error");

        const rawText = data.candidates[0].content.parts[0].text;
        const jsonMatch = rawText.match(/\[[\s\S]*\]/);
        if (!jsonMatch) throw new Error("JSON Array ထွက်မလာပါ");

        const newScenes = JSON.parse(jsonMatch[0]);

        // Memory ထဲသို့ Scene အသစ်များ ပေါင်းထည့်ခြင်း
        newScenes.forEach(s => {
            storyMemory.scenes.push({
                scene_number: s.scene_number,
                time_range: s.time_range || `${(s.scene_number - 1)*8}-${s.scene_number*8}s`,
                burmese_dialogue: s.burmese_dialogue,
                flow_prompt: s.flow_prompt
            });
        });

        // Scene Card အားလုံးကို UI ပေါ် Render ပြန်လုပ်ခြင်း
        renderMultiSceneCards();
                saveStoryMemory();


    } catch (err) {
        console.error("Multi-Shot Error:", err);
        const loadingStatus = document.getElementById('loadingStatus');
        if (loadingStatus) loadingStatus.remove();
        showNeonAlert("Error: " + err.message);
    }
}

// --- Card ပြသပေးသည့် Function ( Voiceover & Prompt Copy Buttons ပါဝင်သည်) ---
function renderMultiSceneCards() {
    const multiResultContent = document.getElementById('multiResultContent');
    let htmlOutput = "";

    storyMemory.scenes.forEach((s, index) => {
        htmlOutput += `
            <div style="background: rgba(0,0,20,0.6); border: 1px solid rgba(0,243,255,0.2); padding: 12px; border-radius: 10px; margin-bottom: 12px;">
                <!-- Header -->
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; border-bottom: 1px solid rgba(0,243,255,0.15); padding-bottom: 6px;">
                    <span style="color: #00f3ff; font-weight: bold; font-size: 13px;">🎬 Scene ${s.scene_number} (${s.time_range})</span>
                </div>

                <!-- မြန်မာ Voiceover Section -->
                <div style="background: rgba(15, 23, 42, 0.6); padding: 8px 10px; border-radius: 8px; margin-bottom: 8px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                        <span style="color: #fbbf24; font-size: 11px; font-weight: bold;">🇲🇲 မြန်မာစကားပြောခန်း / Voiceover:</span>
                        <button class="copy-all-btn" style="background: #fbbf24; color: #000; font-weight: bold; padding: 3px 8px; font-size: 10px;" onclick="copySceneItem(${index}, 'dialogue')">
                            <i class="fa-solid fa-microphone"></i> Voiceover ကူးမည်
                        </button>
                    </div>
                    <p style="margin: 0; font-size: 13px; color: #f8fafc; line-height: 1.4;">${escapeHtml(s.burmese_dialogue)}</p>
                </div>

                <!-- Flow AI Prompt Section -->
                <div style="background: rgba(15, 23, 42, 0.6); padding: 8px 10px; border-radius: 8px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                        <span style="color: #00f3ff; font-size: 11px; font-weight: bold;">🇬🇧 Flow AI Prompt:</span>
                        <button class="copy-all-btn" style="padding: 3px 8px; font-size: 10px;" onclick="copySceneItem(${index}, 'prompt')">
                            <i class="fa-solid fa-wand-magic-sparkles"></i> Prompt ကူးမည်
                        </button>
                    </div>
                    <p style="margin: 0; font-size: 12px; color: #94a3b8; font-family: monospace; line-height: 1.4;">${escapeHtml(s.flow_prompt)}</p>
                </div>
            </div>
        `;
    });

    multiResultContent.innerHTML = htmlOutput;
}

// --- Single Copy Handler (Single Quote / Double Quote အမှားမတတ်အောင် ထိန်းပေးထားသည်) ---
function copySceneItem(sceneIndex, type) {
    if (!storyMemory.scenes[sceneIndex]) return;
    const targetScene = storyMemory.scenes[sceneIndex];
    const textToCopy = (type === 'dialogue') ? targetScene.burmese_dialogue : targetScene.flow_prompt;
    
    navigator.clipboard.writeText(textToCopy);
    const label = (type === 'dialogue') ? 'Voiceover' : 'Flow AI Prompt';
    showNeonAlert(`Scene ${targetScene.scene_number} ${label} ကို ကူးပြီးပါပြီ!`);
}

// --- Text Escape Helper ---
function escapeHtml(text) {
    if (!text) return "";
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// --- Copy Handlers ---
function copyBurmeseScript() {
    const text = document.getElementById('outBurmeseScript')?.innerText;
    if (!text) return;
    navigator.clipboard.writeText(text);
    showNeonAlert("မြန်မာ Script ကို Copy ကူးပြီးပါပြီ!");
}

function copyFlowPrompt() {
    const text = document.getElementById('outFlowPrompt')?.innerText;
    if (!text) return;
    navigator.clipboard.writeText(text);
    showNeonAlert("Flow AI Prompt ကို Copy ကူးပြီးပါပြီ!");
}

function copyAllMultiScenes() {
    if (storyMemory.scenes.length === 0) return;
    let allText = storyMemory.scenes.map(s => `--- Scene ${s.scene_number} (${s.time_range}) ---\n[Voiceover]:\n${s.burmese_dialogue}\n\n[Flow Prompt]:\n${s.flow_prompt}`).join('\n\n====================\n\n');
    navigator.clipboard.writeText(allText);
    showNeonAlert("ဇာတ်လမ်း အခန်းဆက် အားလုံးကို Copy ကူးပြီးပါပြီ!");
}

// AI Script ထဲက Single Shot နဲ့ Movie Director Tab များ ပြောင်းရန်
function switchAiSubTab(tab) {
    const subSingle = document.getElementById('subSectionSingle');
    const subMulti = document.getElementById('subSectionMulti');
    const btnSingle = document.getElementById('tabSingleBtn');
    const btnMulti = document.getElementById('tabMultiBtn');

    if (tab === 'single') {
        subSingle.style.display = 'block';
        subMulti.style.display = 'none';
        
        btnSingle.style.background = "linear-gradient(135deg, #06b6d4, #0284c7)";
        btnSingle.style.color = "#fff";
        btnSingle.style.boxShadow = "0 0 10px rgba(34, 211, 238, 0.4)";

        btnMulti.style.background = "transparent";
        btnMulti.style.color = "#94a3b8";
        btnMulti.style.boxShadow = "none";
    } else {
        subSingle.style.display = 'none';
        subMulti.style.display = 'block';

        btnMulti.style.background = "linear-gradient(135deg, #06b6d4, #0284c7)";
        btnMulti.style.color = "#fff";
        btnMulti.style.boxShadow = "0 0 10px rgba(34, 211, 238, 0.4)";

        btnSingle.style.background = "transparent";
        btnSingle.style.color = "#94a3b8";
        btnSingle.style.boxShadow = "none";
    }
}
// Menu ဖွင့်ရန်
function openSettingsMenu() {
    document.getElementById('scriptMenuModal').style.display = 'flex';
}

// Menu ပိတ်ရန်
function closeScriptMenu() {
    document.getElementById('scriptMenuModal').style.display = 'none';
}

// ၁။ Save Copy လုပ်ခြင်း (LocalStorage ထဲမှာ သိမ်းမည်)
function saveScriptCopy() {
    const textInput = document.getElementById('scriptTextInput') || document.querySelector('textarea'); 
    if (textInput) {
        localStorage.setItem('saved_script_copy', textInput.value);
        alert('✨ Copy သိမ်းဆည်းပြီးပါပြီ သားရီး!');
    } else {
        alert('သိမ်းဆည်းရန် စာသားနေရာ မတွေ့ပါ။');
    }
    closeScriptMenu();
}

// ၂။ Restore လုပ်ခြင်း (သိမ်းထားတာကို ပြန်ခေါ်မည်)
function loadScriptCopy() {
    const savedData = localStorage.getItem('saved_script_copy');
    const textInput = document.getElementById('scriptTextInput') || document.querySelector('textarea');
    
    if (savedData && textInput) {
        textInput.value = savedData;
        alert('📂 သိမ်းဆည်းထားသော Copy ကို ပြန်လည်ဖော်ပြပြီးပါပြီ!');
    } else {
        alert('⚠️ သိမ်းဆည်းထားသော Data မရှိသေးပါ။');
    }
    closeScriptMenu();
}

// ၃။ သေချာမှ ဖျက်မည့် Delete ခလုတ် (Confirm Box ပါဝင်သည်)
function confirmClearScript() {
    const isConfirmed = confirm('❗ အချက်အလက်များကို အမှန်တကယ် ဖျက်ပစ်မှာ လោក?');
    if (isConfirmed) {
        const textInput = document.getElementById('scriptTextInput') || document.querySelector('textarea');
        if (textInput) {
            textInput.value = '';
        }
        localStorage.removeItem('saved_script_copy');
        alert('🗑️ အချက်အလက်များအားလုံးကို ရှင်းလင်းပြီးပါပြီ။');
    }
    closeScriptMenu();
}

// 1. စာရိုက်နေစဉ် သို့မဟုတ် ပြောင်းလဲမှုရှိတိုင်း အလိုအလျောက် LocalStorage ထဲ သိမ်းပေးမည့် Auto-save function
const scriptInputBox = document.getElementById('scriptTextInput') || document.querySelector('textarea');

if (scriptInputBox) {
    // Page ပွင့်လာရင် သိမ်းထားတာရှိရင် ပြန်ပေါ်လာစေရန်
    const savedAutoCopy = localStorage.getItem('auto_saved_script');
    if (savedAutoCopy && !scriptInputBox.value) {
        scriptInputBox.value = savedAutoCopy;
    }

    // စာရိုက်တိုင်း အလိုအလျောက် မှတ်သွားရန်
    scriptInputBox.addEventListener('input', function() {
        localStorage.setItem('auto_saved_script', scriptInputBox.value);
    });
}

let activePickerTarget = null; // 'single' or block ID number
let singleVoiceValue = "Charon";
let currentAudioBlob = null;

const MY_PASSWORD = "1911999";
const API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-tts-preview:generateContent";
let audioURL = null;
let singleAudioURL = null;
let blockCounter = 0;

/* LOCK SCREEN CONTROLS */
function togglePasswordVisibility() {
    const input = document.getElementById('passInput');
    const eyeIcon = document.getElementById('eyeIcon');
    if (input.type === 'password') {
        input.type = 'text';
        if (eyeIcon) {
            eyeIcon.classList.remove('fa-eye');
            eyeIcon.classList.add('fa-eye-slash');
        }
    } else {
        input.type = 'password';
        if (eyeIcon) {
            eyeIcon.classList.remove('fa-eye-slash');
            eyeIcon.classList.add('fa-eye');
        }
    }
}

function checkUnlockPassword() {
    const input = document.getElementById('passInput').value;

    if (input === '') {
        alert('ကျေးဇူးပြု၍ စကားဝှက် ရိုက်ထည့်ပါ!');
    } else if (input === '1911999') {

        const lockScreen = document.getElementById('cyberpunk-lockscreen');
        if (lockScreen) {
            lockScreen.style.transition = 'opacity 0.5s ease';
            lockScreen.style.opacity = '0';
            setTimeout(() => {
                lockScreen.style.display = 'none';
            }, 500);
        }

        const appContent = document.getElementById("appContent");
        if (appContent) {
            appContent.style.display = "block";
        }

        const saved = getStoredKey();
        if (saved) {
            document.getElementById("apiKey").value = saved;
        }
        updateKeyStatus();
    } else {
        alert('စကားဝှက် မှားယွင်းနေပါသည်။');
    }
}
/* =========================================
   SH IMAGE SEARCH — UNSPLASH FREE MODE
   ========================================= */

async function searchAssets() {

    const input = document.getElementById('assetSearchInput');
    const grid = document.getElementById('assetGrid');

    const query = input.value.trim();

    if (!query) {
        input.focus();
        return;
    }

    /* Loading */

    grid.innerHTML = `
        <div class="sh-empty-state">

            <div class="sh-empty-icon">
                <i class="fa-solid fa-spinner fa-spin"></i>
            </div>

            <div class="sh-empty-title">
                ရှာဖွေနေပါတယ်...
            </div>

            <div class="sh-empty-text">
                ${escapeHtml(query)} ပုံများကို ရှာနေပါတယ်
            </div>

        </div>
    `;

    /*
       IMPORTANT:
       ဒီနေရာမှာ မင်းရဲ့ Unsplash API Key အသစ်ထည့်
    */

    const accessKey = 'cLaLLiJz6pnN-U2M5LNepEwmYEEPu1Ld1pJRofvNeZs';

    const url =
        `https://api.unsplash.com/search/photos` +
        `?query=${encodeURIComponent(query)}` +
        `&per_page=20` +
        `&client_id=${encodeURIComponent(accessKey)}`;

    try {

        const response = await fetch(url);

        if (!response.ok) {
    const errorText = await response.text();

    throw new Error(
        `Unsplash API Error: ${response.status} - ${errorText}`
    );
}

        const data = await response.json();

        if (!data.results || data.results.length === 0) {

            grid.innerHTML = `
                <div class="sh-empty-state">

                    <div class="sh-empty-icon">
                        <i class="fa-regular fa-face-frown"></i>
                    </div>

                    <div class="sh-empty-title">
                        ပုံမတွေ့ပါ
                    </div>

                    <div class="sh-empty-text">
                        အခြားစာလုံးနဲ့ ပြန်ရှာကြည့်ပါ
                    </div>

                </div>
            `;

            return;
        }

        grid.innerHTML = '';

        data.results.forEach(photo => {

            const card = document.createElement('div');

            card.className = 'sh-asset-card';

            const image = document.createElement('img');

            image.src = photo.urls.small;

            image.alt =
                photo.alt_description ||
                query;

            image.loading = 'lazy';

            /*
               Main grid မှာ user name မပြဘူး
            */

            const overlay =
                document.createElement('div');

            overlay.className =
                'sh-image-overlay';

            /*
               Unsplash download tracking
            */

            const download =
                document.createElement('a');

            download.className =
                'sh-image-download';

            download.href =
                photo.links.download_location;

            download.target = '_blank';

            download.rel =
                'noopener noreferrer';

            download.innerHTML =
                '<i class="fa-solid fa-download"></i>';

            download.title =
                'Download';

            /*
               Download ကိုနှိပ်တဲ့အခါ
               Unsplash download endpoint ကို trigger
            */

            download.addEventListener(
                'click',
                async function(e) {

                    e.preventDefault();

                    try {
                        await fetch(
                            photo.links.download_location
                        );
                    } catch (err) {
                        console.warn(
                            'Download tracking failed',
                            err
                        );
                    }

                    /*
                       Full image ကိုဖွင့်
                    */

                    window.open(
                        photo.urls.full,
                        '_blank',
                        'noopener'
                    );
                }
            );

            overlay.appendChild(download);

            card.appendChild(image);
            card.appendChild(overlay);

            /*
               ပုံနှိပ်ရင် Preview
            */

            image.addEventListener(
                'click',
                function() {
                    openImagePreview(photo);
                }
            );

            grid.appendChild(card);
        });

    } catch (error) {

        console.error('UNSPLASH ERROR:', error);
alert(error.message);

        grid.innerHTML = `
            <div class="sh-empty-state">

                <div
                    class="sh-empty-icon"
                    style="color:#fb7185;"
                >
                    <i class="fa-solid fa-triangle-exclamation"></i>
                </div>

                <div class="sh-empty-title">
                    ရှာဖွေရာမှာ အမှားဖြစ်နေပါတယ်
                </div>

                <div class="sh-empty-text">
                    API Key နဲ့ Internet connection ကို
                    ပြန်စစ်ကြည့်ပါ
                </div>

            </div>
        `;
    }
}


/* =========================================
   IMAGE PREVIEW
   ========================================= */

function openImagePreview(photo) {

    let modal =
        document.getElementById(
            'shImagePreviewModal'
        );

    if (!modal) {

        modal =
            document.createElement('div');

        modal.id =
            'shImagePreviewModal';

        modal.innerHTML = `

            <div class="sh-preview-backdrop">

                <div class="sh-preview-box">

                    <button
                        class="sh-preview-close"
                        onclick="closeImagePreview()"
                    >
                        <i class="fa-solid fa-xmark"></i>
                    </button>

                    <img
                        id="shPreviewImage"
                        src=""
                        alt=""
                    >

                    <div
                        class="sh-preview-info"
                        id="shPreviewInfo"
                    ></div>

                </div>

            </div>
        `;

        document.body.appendChild(modal);

        const style =
            document.createElement('style');

        style.textContent = `

            #shImagePreviewModal {
                position: fixed;
                inset: 0;
                z-index: 99999;
            }

            .sh-preview-backdrop {
                position: absolute;
                inset: 0;

                display: flex;
                align-items: center;
                justify-content: center;

                padding: 20px;

                background:
                    rgba(1,8,16,0.88);

                backdrop-filter: blur(16px);
                -webkit-backdrop-filter: blur(16px);
            }

            .sh-preview-box {
                position: relative;

                width: min(100%, 420px);

                padding: 8px;

                border-radius: 20px;

                background:
                    rgba(10,25,42,0.78);

                border:
                    1px solid
                    rgba(34,211,238,0.25);

                box-shadow:
                    0 0 40px
                    rgba(34,211,238,0.10);
            }

            .sh-preview-box img {
                width: 100%;
                max-height: 70vh;

                display: block;

                object-fit: contain;

                border-radius: 15px;
            }

            .sh-preview-close {
                position: absolute;

                top: 15px;
                right: 15px;

                z-index: 2;

                width: 34px;
                height: 34px;

                border-radius: 10px;

                border:
                    1px solid
                    rgba(255,255,255,0.12);

                background:
                    rgba(0,0,0,0.55);

                color: #fff;

                cursor: pointer;
            }

            .sh-preview-info {
                padding: 8px 5px 3px;

                color: #6f8da3;
                font-size: 8px;
                text-align: center;
            }
        `;

        document.head.appendChild(style);
    }

    const previewImage =
        document.getElementById(
            'shPreviewImage'
        );

    const info =
        document.getElementById(
            'shPreviewInfo'
        );

    previewImage.src =
        photo.urls.regular;

    /*
       Main card မှာမပြပေမယ့်
       Preview ထဲမှာ attribution ထား
    */

    info.innerHTML =
        `Photo by ${escapeHtml(photo.user.name)} · Unsplash`;

    modal.style.display = 'block';
}


function closeImagePreview() {

    const modal =
        document.getElementById(
            'shImagePreviewModal'
        );

    if (modal) {
        modal.style.display = 'none';
    }
}


/* =========================================
   HTML SAFETY
   ========================================= */

function escapeHtml(value) {

    const div =
        document.createElement('div');

    div.textContent =
        value || '';

    return div.innerHTML;
}


/* =========================================
   ENTER KEY SEARCH
   ========================================= */

document.addEventListener(
    'keydown',
    function(e) {

        if (
            e.key === 'Enter' &&
            document.activeElement &&
            document.activeElement.id ===
                'assetSearchInput'
        ) {

            searchAssets();
        }
    }
);
/* =========================================================
   SH PRO ASSET HUB — SUPABASE CLOUD
   Public Search / Preview / Download
   Admin Upload / Delete
   Auto Image Compression
   ========================================================= */


/* ---------------------------------------------------------
   1. SUPABASE CONFIG
   --------------------------------------------------------- */

const SH_SUPABASE_URL ='https://yrlixhgqeltneczvkuko.supabase.co';
    
const SH_SUPABASE_ANON_KEY =
    'sb_publishable_Sqq0AYUqABRVBMHOqFp6QA_QqNi9xJo';

/* IMPORTANT:
   Do NOT put service_role / secret key here.
*/

const shSupabase =
    window.supabase.createClient(
        SH_SUPABASE_URL,
        SH_SUPABASE_ANON_KEY
    );

/* ---------------------------------------------------------
   2. SETTINGS
   --------------------------------------------------------- */

const SH_PRO_BUCKET = 'Assets';
const SH_PRO_TABLE  = 'images';

const SH_MAX_IMAGE_SIZE = 1920;
const SH_WEBP_QUALITY = 0.88;


/* ---------------------------------------------------------
   3. BASIC HELPERS
   --------------------------------------------------------- */

function shShowProMessage(message) {

    console.log('[SH Pro]', message);

    if (typeof showToast === 'function') {
        showToast(message);
        return;
    }

    alert(message);
}


function shSafeText(value) {

    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}


/* ---------------------------------------------------------
   4. OPEN FILE PICKER
   --------------------------------------------------------- */

function openProAssetPicker() {

    const input =
        document.getElementById('proAssetFileInput');

    if (!input) {
        console.error(
            'proAssetFileInput not found'
        );
        return;
    }

    input.value = '';
    input.click();
}


/* ---------------------------------------------------------
   5. IMAGE COMPRESSION
   --------------------------------------------------------- */

async function shCompressImage(file) {

    return new Promise((resolve, reject) => {

        const reader = new FileReader();

        reader.onload = function () {

            const img = new Image();

            img.onload = function () {

                let width = img.naturalWidth;
                let height = img.naturalHeight;

                /*
                 * Keep original size if already small.
                 * Otherwise scale down to max 1920.
                 */

                const maxSize =
                    SH_MAX_IMAGE_SIZE;

                if (
                    width > maxSize ||
                    height > maxSize
                ) {

                    const ratio =
                        Math.min(
                            maxSize / width,
                            maxSize / height
                        );

                    width =
                        Math.round(width * ratio);

                    height =
                        Math.round(height * ratio);
                }


                const canvas =
                    document.createElement('canvas');

                canvas.width = width;
                canvas.height = height;


                const ctx =
                    canvas.getContext('2d');

                if (!ctx) {
                    reject(
                        new Error(
                            'Canvas is not supported'
                        )
                    );
                    return;
                }


                /*
                 * White background prevents transparent
                 * images becoming black when converted to JPEG.
                 */

                ctx.fillStyle = '#ffffff';

                ctx.fillRect(
                    0,
                    0,
                    width,
                    height
                );


                ctx.drawImage(
                    img,
                    0,
                    0,
                    width,
                    height
                );


                /*
                 * Prefer WebP.
                 */

                canvas.toBlob(
                    function (blob) {

                        if (!blob) {
                            reject(
                                new Error(
                                    'Image compression failed'
                                )
                            );
                            return;
                        }


                        const compressedName =
                            (
                                file.name
                                    .replace(
                                        /\.[^/.]+$/,
                                        ''
                                    )
                            ) +
                            '_' +
                            Date.now() +
                            '.webp';


                        const compressedFile =
                            new File(
                                [blob],
                                compressedName,
                                {
                                    type: 'image/webp'
                                }
                            );


                        resolve(
                            compressedFile
                        );

                    },
                    'image/webp',
                    SH_WEBP_QUALITY
                );

            };


            img.onerror = function () {

                reject(
                    new Error(
                        'Image could not be loaded'
                    )
                );

            };


            img.src = reader.result;
        };


        reader.onerror = function () {

            reject(
                new Error(
                    'Image could not be read'
                )
            );

        };


        reader.readAsDataURL(file);
    });
}


/* ---------------------------------------------------------
   6. CREATE UNIQUE FILE PATH
   --------------------------------------------------------- */

function shCreateStoragePath(file) {

    const randomPart =
        Math.random()
            .toString(36)
            .substring(2, 10);

    return (
        'assets/' +
        Date.now() +
        '_' +
        randomPart +
        '.webp'
    );
}


/* ---------------------------------------------------------
   7. UPLOAD FILES
   --------------------------------------------------------- */

async function handleProAssetFiles(event) {

    const input = event.target;

    if (!input || !input.files) {
        return;
    }


    const files =
        Array.from(input.files)
            .filter(file =>
                file.type.startsWith('image/')
            );


    if (!files.length) {
        shShowProMessage(
            'ပုံဖိုင် မတွေ့ပါ။'
        );
        return;
    }


    /*
     * Temporary category input.
     *
     * Later we can replace this with the
     * Neon Glass custom category popup.
     */

    const category =
        prompt(
            'ဒီပုံတွေအတွက် Category ထည့်ပါ။\nဥပမာ - ရွှေတိဂုံ'
        );


    if (!category || !category.trim()) {

        shShowProMessage(
            'Category မထည့်ရသေးပါ။'
        );

        return;
    }


    const cleanCategory =
        category.trim();


    let successCount = 0;


    try {

        for (
            let i = 0;
            i < files.length;
            i++
        ) {

            const originalFile =
                files[i];


            try {

                /*
                 * 1. Compress
                 */

                const compressedFile =
                    await shCompressImage(
                        originalFile
                    );


                /*
                 * 2. Storage path
                 */

                const storagePath =
                    shCreateStoragePath(
                        compressedFile
                    );


                /*
                 * 3. Upload to Storage
                 */

                const {
                    data: storageData,
                    error: storageError
                } =
                    await shSupabase
                        .storage
                        .from(SH_PRO_BUCKET)
                        .upload(
                            storagePath,
                            compressedFile,
                            {
                                cacheControl:
                                    '31536000',

                                contentType:
                                    'image/webp',

                                upsert: false
                            }
                        );


                if (storageError) {

                    console.error(
                        'Storage upload error:',
                        storageError
                    );

                    throw storageError;
                }


                /*
                 * 4. Public URL
                 */

                const {
                    data: publicData
                } =
                    shSupabase
                        .storage
                        .from(SH_PRO_BUCKET)
                        .getPublicUrl(
                            storagePath
                        );


                const imageUrl =
                    publicData.publicUrl;


                /*
                 * 5. Save metadata
                 *    into Images table
                 */

                const {
                    data: dbData,
                    error: dbError
                } =
                    await shSupabase
                        .from(SH_PRO_TABLE)
                        .insert([
                            {
                                title:
                                    originalFile.name,

                                image_url:
                                    imageUrl,

                                category:
                                    cleanCategory
                            }
                        ])
                        .select();


                /*
                 * If DB fails, remove uploaded file
                 * so we don't leave orphan files.
                 */

                if (dbError) {

                    await shSupabase
                        .storage
                        .from(SH_PRO_BUCKET)
                        .remove([
                            storagePath
                        ]);

                    throw dbError;
                }


                successCount++;

                console.log(
                    'Uploaded:',
                    originalFile.name
                );

            }
            catch (singleError) {

    console.error(
        'Single image upload failed:',
        singleError
    );

    alert(
        'Upload Error:\n\n' +
        (singleError.message || singleError)
    );

}
        }


        if (successCount > 0) {

            shShowProMessage(
                `${successCount} ပုံ Upload အောင်မြင်ပါတယ်။ 🎉`
            );

            await loadSHProAssets();

        }
        else {

            shShowProMessage(
                'console.log(error)'
            );

        }

    }
    catch (error) {

    console.error(
        'Pro upload error:',
        error
    );

    alert(
        'UPLOAD ERROR:\n\n' +
        (error?.message || error)
    );

    shShowProMessage(
        'Upload Error: ' +
        (error?.message || 'Unknown error')
    );

}
    finally {

        input.value = '';
    }
}

/* ---------------------------------------------------------
8. LOAD PUBLIC ASSETS WITH PAGINATION (FIXED)
--------------------------------------------------------- */

let SH_CURRENT_PAGE = 0;
const SH_PAGE_SIZE = 20; // တစ်ကြိမ်လျှင် ၂၀ ပုံသာ ဆွဲယူမည် (RAM သက်သာစေသည်)
let SH_PRO_ASSET_CACHE = [];
let SH_HAS_MORE = true;

async function loadSHProAssets(searchTerm = '', isLoadMore = false) {
  const grid = document.getElementById('proAssetGrid');
  if (!grid) return;

  if (!isLoadMore) {
    SH_CURRENT_PAGE = 0;
    SH_PRO_ASSET_CACHE = [];
    SH_HAS_MORE = true;
    grid.innerHTML = `
      <div class="sh-pro-empty-state">
        <div class="sh-pro-empty-icon">⏳</div>
        <div class="sh-pro-empty-title">ပုံတွေရှာနေပါတယ်</div>
        <div class="sh-pro-empty-text">ခဏစောင့်ပါ...</div>
      </div>
    `;
  }

  try {
    const from = SH_CURRENT_PAGE * SH_PAGE_SIZE;
    const to = from + SH_PAGE_SIZE - 1;

    let query = shSupabase
      .from(SH_PRO_TABLE)
      .select('id,title,image_url,category')
      .order('id', { ascending: false })
      .range(from, to); // Supabase မှ ၂၀ ခုစီသာ Range ဖြင့် ပိုင်းယူမည်

    if (searchTerm && searchTerm.trim()) {
      const keyword = searchTerm.trim();
      query = query.or(`title.ilike.%${keyword}%,category.ilike.%${keyword}%`);
    }

    const { data, error } = await query;

    if (error) throw error;

    const assets = Array.isArray(data) ? data : [];

    if (assets.length < SH_PAGE_SIZE) {
      SH_HAS_MORE = false;
    }

    if (isLoadMore) {
      SH_PRO_ASSET_CACHE = [...SH_PRO_ASSET_CACHE, ...assets];
    } else {
      SH_PRO_ASSET_CACHE = assets;
    }

    renderSHProAssets(SH_PRO_ASSET_CACHE);

  } catch (error) {
    console.error('Public asset load error:', error);
    if (!isLoadMore) {
      grid.innerHTML = `
        <div class="sh-pro-empty-state">
          <div class="sh-pro-empty-icon">⚠️</div>
          <div class="sh-pro-empty-title">ပုံတွေယူလို့မရပါ</div>
          <div class="sh-pro-empty-text">${shSafeText(error.message)}</div>
        </div>
      `;
    }
  }
}

/* ---------------------------------------------------------
9. RENDER ASSET CARDS (FIXED)
--------------------------------------------------------- */

function renderSHProAssets(assets) {
  const grid = document.getElementById('proAssetGrid');
  if (!grid) return;

  if (!assets.length) {
    grid.innerHTML = `
      <div class="sh-pro-empty-state">
        <div class="sh-pro-empty-icon">🔍</div>
        <div class="sh-pro-empty-title">ပုံမတွေ့ပါ</div>
        <div class="sh-pro-empty-text">ရှာဖွေတဲ့ Category နဲ့ ကိုက်ညီတဲ့ပုံ မရှိသေးပါ။</div>
      </div>
    `;
    return;
  }

  let cardsHtml = assets.map(asset => createSHProAssetCard(asset)).join('');

  if (SH_HAS_MORE) {
    cardsHtml += `
      <div style="grid-column: 1 / -1; text-align: center; margin: 20px 0;">
        <button id="shLoadMoreBtn" class="sh-pro-download" onclick="shProLoadNextPage()" style="padding: 10px 24px; font-size: 14px;">
          <i class="fa-solid fa-arrows-rotate"></i> နောက်ထပ်ပုံများ ကြည့်ရန် (Load More)
        </button>
      </div>
    `;
  }

  grid.innerHTML = cardsHtml;
}

function shProLoadNextPage() {
  SH_CURRENT_PAGE++;
  const searchInput = document.getElementById('proAssetSearchInput');
  const term = searchInput ? searchInput.value : '';
  loadSHProAssets(term, true);
}

/* ---------------------------------------------------------
10. CREATE CARD
--------------------------------------------------------- */

function createSHProAssetCard(asset) {
  const id = Number(asset.id);
  const imageUrl = shSafeText(asset.image_url);
  const category = shSafeText(asset.category || 'Uncategorized');
  const title = shSafeText(asset.title || 'SH Asset');

  return `
    <div class="sh-pro-asset-card" data-asset-id="${id}">
      <div class="sh-pro-image-wrap" onclick="openSHProImagePreview(${id})">
        <img src="${imageUrl}" alt="${title}" loading="lazy" onerror="this.style.opacity='0.25'">
        <div class="sh-pro-image-overlay">
          <i class="fa-solid fa-expand"></i>
        </div>
      </div>
      <div class="sh-pro-asset-info">
        <div class="sh-pro-asset-category">${category}</div>
        <div class="sh-pro-asset-name">${title}</div>
        <div class="sh-pro-card-actions">
          <button class="sh-pro-download" onclick="event.stopPropagation(); downloadSHProAsset(${id})">
            <i class="fa-solid fa-download"></i> Download
          </button>
          <button class="sh-pro-delete" onclick="event.stopPropagation(); deleteSHProAsset(${id})" title="Delete">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      </div>
    </div>
  `;
}

/* ---------------------------------------------------------
   13. GET ONE ASSET
   --------------------------------------------------------- */

function getSHProAssetById(id) {
    return SH_PRO_ASSET_CACHE.find(
        asset => 
            String(asset.id) === String(id)
    );
}


/* ---------------------------------------------------------
14. PREVIEW (FIXED FOR CRASH)
--------------------------------------------------------- */

function openSHProImagePreview(id) {
  const asset = getSHProAssetById(id);
  if (!asset) {
    shShowProMessage('ပုံကို ရှာမတွေ့ပါ။');
    return;
  }

  // ၁။ ယခင် ပွင့်နေသော Preview အဟောင်းရှိပါက RAM ရှင်းရန် အရင်ဖျက်ပါ
  const oldPreview = document.getElementById('shProImagePreview');
  if (oldPreview) {
    oldPreview.remove();
  }

  // ၂။ Preview Box သစ် ဖန်တီးပါ
  const preview = document.createElement('div');
  preview.id = 'shProImagePreview';
  
  // 3. RAM/GPU Crash မဖြစ်စေရန် Image Container တွင် Max-Height နှင့် Decoding Async သတ်မှတ်ထားသည်
  preview.innerHTML = `
    <div class="sh-pro-preview-backdrop" onclick="closeSHProImagePreview(event)">
      <div class="sh-pro-preview-box" onclick="event.stopPropagation()">
        <button class="sh-pro-preview-close" onclick="closeSHProImagePreview()">
          <i class="fa-solid fa-xmark"></i>
        </button>
        <div style="width: 100%; max-height: 55vh; display: flex; align-items: center; justify-content: center; overflow: hidden; background: #000; border-radius: 8px;">
          <img class="sh-pro-preview-image" 
               src="${shSafeText(asset.image_url)}" 
               alt="${shSafeText(asset.title || 'SH Asset')}"
               decoding="async"
               style="max-width: 100%; max-height: 55vh; object-fit: contain; display: block;"
          >
        </div>
        <div class="sh-pro-preview-info">
          <div class="sh-pro-preview-category">${shSafeText(asset.category || '')}</div>
          <div class="sh-pro-preview-title">${shSafeText(asset.title || 'SH Asset')}</div>
        </div>
        <button class="sh-pro-preview-download" onclick="downloadSHProAsset(${Number(asset.id)})">
          <i class="fa-solid fa-download"></i> Download
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(preview);
}
                    
/* ---------------------------------------------------------
   15. CLOSE PREVIEW
   --------------------------------------------------------- */

function closeSHProImagePreview(
    event
) {

    if (
        event &&
        event.target &&
        event.target.classList &&
        !event.target.classList.contains(
            'sh-pro-preview-backdrop'
        )
    ) {
        return;
    }


    const preview =
        document.getElementById(
            'shProImagePreview'
        );


    if (preview) {
        preview.remove();
    }
}


/* ---------------------------------------------------------
   16. DOWNLOAD
   --------------------------------------------------------- */

async function downloadSHProAsset(
    id
) {

    const asset =
        getSHProAssetById(id);


    if (!asset) {

        shShowProMessage(
            'Download လုပ်မယ့်ပုံ မတွေ့ပါ။'
        );

        return;
    }


    try {

        /*
         * Fetch image as Blob.
         * This makes Android / CapCut handling
         * more reliable than simply opening the URL.
         */

        const response =
            await fetch(
                asset.image_url
            );


        if (!response.ok) {
            throw new Error(
                'Image download failed'
            );
        }


        const blob =
            await response.blob();


        const blobUrl =
            URL.createObjectURL(
                blob
            );


        const link =
            document.createElement('a');


        link.href =
            blobUrl;


        link.download =
            (
                String(
                    asset.title ||
                    'SH_Asset'
                )
                .replace(
                    /\.[^/.]+$/,
                    ''
                )
            ) +
            '.webp';


        document.body.appendChild(
            link
        );


        link.click();


        link.remove();


        setTimeout(() => {

            URL.revokeObjectURL(
                blobUrl
            );

        }, 1500);


    }
    catch (error) {

        console.error(
            'Download error:',
            error
        );


        /*
         * Fallback:
         * open public URL.
         */

        window.open(
            asset.image_url,
            '_blank'
        );
    }
}


/* ---------------------------------------------------------
   17. DELETE
   ---------------------------------------------------------
   IMPORTANT:
   This function is NOT secure by itself.
   Supabase RLS MUST protect DELETE.
   Later we will restrict this to Admin only.
   --------------------------------------------------------- */

async function deleteSHProAsset(
    id
) {

    const asset =
        getSHProAssetById(id);


    if (!asset) {
        return;
    }


    const confirmed =
        confirm(
            'ဒီပုံကို ဖျက်မှာ သေချာလား?'
        );


    if (!confirmed) {
        return;
    }


    try {

        /*
         * First delete DB record.
         */

        const {
            error: dbError
        } =
            await shSupabase
                .from(SH_PRO_TABLE)
                .delete()
                .eq(
                    'id',
                    id
                );


        if (dbError) {
            throw dbError;
        }


        /*
         * Then remove Storage file.
         */

        const storagePath =
            shGetStoragePathFromPublicUrl(
                asset.image_url
            );


        if (storagePath) {

            const {
                error: storageError
            } =
                await shSupabase
                    .storage
                    .from(SH_PRO_BUCKET)
                    .remove([
                        storagePath
                    ]);


            if (storageError) {

                console.warn(
                    'Storage delete warning:',
                    storageError
                );
            }
        }


        shShowProMessage(
            'ပုံဖျက်ပြီးပါပြီ။'
        );


        await loadSHProAssets();


    }
    catch (error) {

        console.error(
            'Delete error:',
            error
        );


        shShowProMessage(
            'Delete မလုပ်နိုင်ပါ။ Admin Permission / RLS ကို စစ်ပါ။'
        );
    }
}


/* ---------------------------------------------------------
   18. GET STORAGE PATH
   --------------------------------------------------------- */

function shGetStoragePathFromPublicUrl(
    publicUrl
) {

    try {

        const marker =
            `/storage/v1/object/public/${SH_PRO_BUCKET}/`;


        const index =
            publicUrl.indexOf(
                marker
            );


        if (index === -1) {
            return null;
        }


        return decodeURIComponent(
            publicUrl.substring(
                index +
                marker.length
            )
        );

    }
    catch (error) {

        console.error(
            error
        );

        return null;
    }
}


/* ---------------------------------------------------------
   19. CATEGORY FILTER
   --------------------------------------------------------- */

async function filterProAssets(
    category
) {

    const input =
        document.getElementById(
            'proAssetSearchInput'
        );


    if (input) {
        input.value =
            category;
    }


    await loadSHProAssets(
        category
    );
}


/* ---------------------------------------------------------
   20. SEARCH INPUT
   --------------------------------------------------------- */

(function initSHProSearch() {

    const input =
        document.getElementById(
            'proAssetSearchInput'
        );


    if (!input) {
        return;
    }


    let timer = null;


    input.addEventListener(
        'input',
        function () {

            clearTimeout(
                timer
            );


            timer =
                setTimeout(
                    () => {

                        loadSHProAssets(
                            input.value
                        );

                    },
                    300
                );
        }
    );


    input.addEventListener(
        'keydown',
        function (event) {

            if (
                event.key === 'Enter'
            ) {

                event.preventDefault();

                loadSHProAssets(
                    input.value
                );
            }
        }
    );

})();


/* ---------------------------------------------------------
   21. FREE / PRO SWITCH
   --------------------------------------------------------- */

function switchAssetMode(
    mode
) {

    const freeArea =
        document.getElementById(
            'assetFreeArea'
        );


    const proArea =
        document.getElementById(
            'assetProArea'
        );


    const freeTab =
        document.getElementById(
            'assetFreeTab'
        );


    const proTab =
        document.getElementById(
            'assetProTab'
        );


    if (mode === 'pro') {

        if (freeArea) {
            freeArea.style.display =
                'none';
        }


        if (proArea) {
            proArea.style.display =
                'block';
        }


        if (freeTab) {
            freeTab.classList.remove(
                'active'
            );
        }


        if (proTab) {
            proTab.classList.add(
                'active'
            );
        }


        /*
         * Load Cloud Assets.
         */

        loadSHProAssets();
    }

    else {

        if (freeArea) {
            freeArea.style.display =
                'block';
        }


        if (proArea) {
            proArea.style.display =
                'none';
        }


        if (freeTab) {
            freeTab.classList.add(
                'active'
            );
        }


        if (proTab) {
            proTab.classList.remove(
                'active'
            );
        }
    }
}


/* ---------------------------------------------------------
   22. TEST SUPABASE
   --------------------------------------------------------- */

async function testSHSupabaseConnection() {

    try {

        const {
            data,
            error
        } =
            await shSupabase
                .from(SH_PRO_TABLE)
                .select(
                    'id'
                )
                .limit(1);


        if (error) {

            console.error(
                'Supabase connection error:',
                error
            );

            shShowProMessage(
                'Supabase ချိတ်မရပါ။\n' +
                error.message
            );

            return false;
        }


        console.log(
            'SH Supabase connection OK',
            data
        );


        return true;

    }
    catch (error) {

        console.error(
            error
        );

        return false;
    }
}


/* ---------------------------------------------------------
   23. INITIAL START
   --------------------------------------------------------- */

document.addEventListener(
    'DOMContentLoaded',
    function () {

        console.log(
            'SH Pro Asset Cloud loaded'
        );

        /*
         * We don't automatically load until
         * the user opens PRO.
         */

    }
);
  
/* FORMAT & STYLE MODAL LOGICS */
function setAudioFormat(formatValue) {
  const btnWav = document.getElementById('btnWav');
  const btnMp3 = document.getElementById('btnMp3');
  const select = document.getElementById('formatSelect');

  if (formatValue === 'wav') {
    btnWav.style.background = '#0088ff';
    btnWav.style.color = '#ffffff';
    btnMp3.style.background = 'transparent';
    btnMp3.style.color = '#8b9bb4';
  } else {
    btnMp3.style.background = '#0088ff';
    btnMp3.style.color = '#ffffff';
    btnWav.style.background = 'transparent';
    btnWav.style.color = '#8b9bb4';
  }

  if (select) {
    select.value = formatValue;
    select.dispatchEvent(new Event('change'));
  }
}

function openSingleStyleModal() {
  document.getElementById('singleStyleModalOverlay').style.display = 'flex';
}

function closeSingleStyleModal() {
  document.getElementById('singleStyleModalOverlay').style.display = 'none';
}

function selectSingleStyleOption(element, displayText, promptValue) {
  document.getElementById('singleSelectedStyleDisplay').innerText = displayText;
  document.getElementById('singleStyleSelect').value = promptValue;
  
  const modalCards = element.parentElement.querySelectorAll('.modal-style-card');
  modalCards.forEach(card => card.classList.remove('active'));
  element.classList.add('active');
  
  closeSingleStyleModal();
}

function openStyleModal() {
  document.getElementById('styleModalOverlay').style.display = 'flex';
}

function closeStyleModal() {
  document.getElementById('styleModalOverlay').style.display = 'none';
}

function selectStyleOption(element, displayText, promptValue) {
  document.getElementById('selectedStyleDisplay').innerText = displayText;
  document.getElementById('styleSelect').value = promptValue;
  
  document.querySelectorAll('#styleModalOverlay .modal-style-card').forEach(card => card.classList.remove('active'));
  element.classList.add('active');
  
  closeStyleModal();
}
/* VOICE PICKER MODAL LOGIC */
function openVoicePicker(target) {
    activePickerTarget = target;
    const modal = document.getElementById("voicePickerModal");
    modal.style.display = "flex";

    let currentVal = "";
    if (target === 'single') {
        currentVal = singleVoiceValue;
    } else {
        const block = document.getElementById(`speechBlock_${target}`);
        if(block) currentVal = block.getAttribute("data-speaker");
    }

    document.querySelectorAll(".voice-card-option").forEach(card => {
        if(card.getAttribute("data-voice") === currentVal) {
            card.classList.add("selected");
        } else {
            card.classList.remove("selected");
        }
    });
}

function closeVoicePicker() {
    document.getElementById("voicePickerModal").style.display = "none";
}

function selectVoiceOption(voiceVal, displayLabel) {
    if (activePickerTarget === 'single') {
        singleVoiceValue = voiceVal;
        document.getElementById("singleSelectedSpeakerText").textContent = displayLabel;
    } else {
        const block = document.getElementById(`speechBlock_${activePickerTarget}`);
        if(block) {
            block.setAttribute("data-speaker", voiceVal);
            block.querySelector(".block-speaker-label").textContent = displayLabel;
        }
    }
    closeVoicePicker();
}

/* SIDEBAR & OPTIONS */
function openSidebar() {
    document.getElementById("mySidebar").style.left = "0";
    document.getElementById("overlay").style.display = "block";
}

function closeSidebar() {
    document.getElementById("mySidebar").style.left = "-310px";
    document.getElementById("overlay").style.display = "none";
}

function openHistoryModal() {
    document.getElementById("historyModal").style.display = "flex";
    renderHistory();
}

function closeHistoryModal() {
    document.getElementById("historyModal").style.display = "none";
}

function toggleTempSlider() {
    const isChecked = document.getElementById("tempToggle").checked;
    document.getElementById("tempSliderWrap").style.display = isChecked ? "block" : "none";
}

// 1. Speech Block အသစ်ထည့်သွင်းခြင်း
function addSpeechBlock(initialText = "", selectedSpeaker = "Charon") {
    const container = document.getElementById("speechBlocksContainer");
    
    const blockDiv = document.createElement("div");
    blockDiv.className = "speech-block-card voice-card-container";
    
    blockCounter++;
    blockDiv.id = `speechBlock_${blockCounter}`;
    const speakerLabelMap = {
        "Puck": "Puck (တက်ကြွလှုပ်ရှား လူငယ်သံ)",
        "Charon": "Charon (သတင်း/ဗဟုသုတပေး တည်ငြိမ်သံ)",
        "Fenrir": "Fenrir (စိတ်လှုပ်ရှားဖွယ် ဇာတ်လမ်းသံ)",
        "Orus": "Orus (ပြတ်သားခိုင်မာ ရင့်ကျက်သံ)",
        "Kore": "Kore (ပြတ်သားခိုင်မာ လူငယ်သံ)",
        "Leda": "Leda (နုပျိုတက်ကြွ ချိုသာသံ)",
        "Aoede": "Aoede (ပေါ့ပါးလန်းဆန်း စကားပြောသံ)",
        "Callirrhoe": "Callirrhoe (အေးဆေးပေါ့ပါး သဘာဝသံ)",
        "Despina": "Despina (ချောမွေ့ငြိမ့်ညောင်း ဇာတ်လမ်းသံ)"
    };
        
    blockDiv.innerHTML = `
        <!-- Single Voice လို နှစ်ထပ်ကွမ်း သပ်ရပ်သော Card ဖွဲ့စည်းပုံ -->
        <div class="speech-block-inner-card" style="background: rgba(10, 15, 30, 0.45); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 14px; padding: 14px;">
            
            <!-- Header (မိုက်အိုင်ကွန်နှင့် နံပါတ်စဉ်) -->
            <div class="block-card-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 8px;">
                <div style="display: flex; align-items: center; gap: 8px;">
                    <div style="width: 26px; height: 26px; border-radius: 6px; background: rgba(0, 210, 255, 0.15); display: flex; align-items: center; justify-content: center; color: #00d2ff; font-size: 11px;">
                        <i class="fa-solid fa-microphone"></i>
                    </div>
                    <h3 class="block-number-text" style="font-size: 13px; font-weight: bold; color: #ffffff; margin: 0;">Speech Block</h3>
                </div>
            </div>
            
            <!-- Speaker Selection -->
            <div style="margin-bottom: 10px;">
                <label style="display: block; font-size: 11px; color: #8eb0cb; margin-bottom: 3px;">Speaker</label>
                <div class="speaker-select-trigger" onclick="openVoicePicker(${blockCounter})" style="background: rgba(10, 15, 30, 0.75); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 9px 12px; display: flex; justify-content: space-between; align-items: center; cursor: pointer; color: #fff; font-size: 12px;">
                    <span class="block-speaker-label">${speakerLabelMap[selectedSpeaker] || selectedSpeaker}</span>
                    <span style="color: #8b9bb4; font-size: 10px;">▼</span>
                </div>
            </div>

            <!-- Voice Style Selection -->
            <div style="margin-bottom: 10px;">
                <label style="display: block; font-size: 11px; color: #8eb0cb; margin-bottom: 3px;">Voice</label>
                <div class="style-trigger-box" onclick="openStyleModal()" style="background: rgba(10, 15, 30, 0.75); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 9px 12px; display: flex; justify-content: space-between; align-items: center; cursor: pointer;">
                    <span style="font-size: 12px; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">Warm - နွေးထွေးယုယသော စကားပြောအသံ</span>
                    <span style="color: #8b9bb4; font-size: 10px;">▼</span>
                </div>
            </div>

            <!-- Text Input -->
            <div style="margin-bottom: 10px;">
                <label style="display: block; font-size: 11px; color: #8eb0cb; margin-bottom: 3px;">Text</label>
                <textarea class="block-textarea block-text-input" style="min-height: 100px; background: rgba(10, 15, 30, 0.75); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; color: #fff; padding: 10px; width: 100%; resize: vertical; font-size: 12px;" placeholder="ဒီ block အတွက် ပြောရမည့် စာသား ရိုက်ထည့်ပါ...">${initialText}</textarea>
            </div>

            <!-- Controls & Delete (Move Up, Move Down နှင့် Delete ခလုတ်များ) -->
            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px;">
                <div style="display: flex; gap: 6px;">
                    <button class="btn-card-ctrl" onclick="moveBlockUp(${blockCounter})" style="background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); color: #fff; padding: 5px 10px; border-radius: 6px; font-size: 11px; cursor: pointer;">↑ Move Up</button>
                    <button class="btn-card-ctrl" onclick="moveBlockDown(${blockCounter})" style="background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); color: #fff; padding: 5px 10px; border-radius: 6px; font-size: 11px; cursor: pointer;">↓ Move Down</button>
                </div>
                <button type="button" class="btn-card-delete" onclick="removeSpeechBlock(${blockCounter})" style="background: rgba(255,0,0,0.15); color: #ff4d4d; border: 1px solid rgba(255,0,0,0.3); padding: 5px 10px; border-radius: 6px; font-size: 11px; cursor: pointer; font-weight: bold;">Delete</button>
            </div>

        </div>
    `;


    container.appendChild(blockDiv);
    reindexBlocks();
}

// 2. ဘလောက်ဖျက်ခြင်း
function removeSpeechBlock(id) {
    const block = document.getElementById(`speechBlock_${id}`);
    if (block) {
        block.remove();
        reindexBlocks();
    }
}

// 3. အပေါ်ရွှေ့ခြင်း
function moveBlockUp(id) {
    const block = document.getElementById(`speechBlock_${id}`);
    if (block && block.previousElementSibling) {
        block.parentNode.insertBefore(block, block.previousElementSibling);
        reindexBlocks();
    }
}

// 4. အောက်ရွှေ့ခြင်း
function moveBlockDown(id) {
    const block = document.getElementById(`speechBlock_${id}`);
    if (block && block.nextElementSibling) {
        block.parentNode.insertBefore(block.nextElementSibling, block);
        reindexBlocks();
    }
}

// 5. နံပါတ်စဉ်များနှင့် Add Button စာသားကို ညီညာအောင် ပြန်စီခြင်း
function reindexBlocks() {
    const blocks = document.querySelectorAll(".speech-block-card");
    blocks.forEach((el, index) => {
        const numText = el.querySelector(".block-number-text");
        if (numText) {
            numText.textContent = `Speech Block (${index + 1})`;
        }
    });

    const addBtn = document.getElementById("addBlockBtn");
    if (addBtn) {
        addBtn.textContent = `+ Add Speech Block (${blocks.length + 1})`;
    }
}

/* =========================================================
GEMINI API KEY
========================================================= */

function getStoredKey(){
return localStorage.getItem("gemini_api_key") || "";
}

function updateKeyStatus(){

const input = document.getElementById("apiKey");
const status = document.getElementById("keyStatus");

if(!input || !status) return;

const key = input.value.trim();

if(key){
    status.textContent = "Ready";
    status.style.color = "#00ff9d";
    status.style.background = "rgba(0,255,157,0.12)";
    status.style.borderColor = "rgba(0,255,157,0.3)";
}else{
    status.textContent = "Missing";
    status.style.color = "#ff4d4d";
    status.style.background = "rgba(255,77,77,0.15)";
    status.style.borderColor = "rgba(255,77,77,0.3)";
}

}

function saveKey(){

const input = document.getElementById("apiKey");
const saveBox = document.getElementById("saveKey");

if(!input) return;

const key = input.value.trim();

if(!key){
    showKeyMessage("API Key မထည့်ရသေးပါ။", "error");
    return;
}

if(saveBox && saveBox.checked){
    localStorage.setItem("gemini_api_key", key);
}

updateKeyStatus();

showKeyMessage(
    "✅ Gemini API Key ကို သိမ်းပြီးပါပြီ။",
    "success"
);

}

function changeKey(){

const input = document.getElementById("apiKey");

if(!input) return;

input.focus();
input.select();

}

function removeKey(){

localStorage.removeItem("gemini_api_key");

const input = document.getElementById("apiKey");

if(input){
    input.value = "";
}

updateKeyStatus();

showKeyMessage(
    "Gemini API Key ကို ဖျက်ပြီးပါပြီ။",
    "success"
);

}

function toggleKey(){

const input = document.getElementById("apiKey");

if(!input) return;

input.type =
    input.type === "password"
        ? "text"
        : "password";

}

function showKeyMessage(text, type){

const box = document.getElementById("keyMessage");

if(!box) return;

box.textContent = text;

if(type === "error"){
    box.style.color = "#ff4d4d";
}else if(type === "success"){
    box.style.color = "#00ff9d";
}else{
    box.style.color = "#00baff";
}

}

async function testKey(){

const input = document.getElementById("apiKey");

if(!input) return;

const rawKeys = input.value.trim();

if(!rawKeys){
    showKeyMessage(
        "အရင်ဆုံး Gemini API Key ထည့်ပါ။",
        "error"
    );
    return;
}

const keysList = rawKeys
    .split(",")
    .map(k => k.trim())
    .filter(k => k.length > 0);

showKeyMessage(
    "🔄 Gemini API Key ကို စစ်ဆေးနေပါတယ်...",
    "info"
);

try{

    const response = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models",
        {
            method:"GET",
            headers:{
                "x-goog-api-key":keysList[0]
            }
        }
    );

    const data = await response
        .json()
        .catch(() => ({}));

    if(!response.ok){

        throw new Error(
            data?.error?.message ||
            `HTTP ${response.status}`
        );

    }

    if(
        document.getElementById("saveKey")?.checked
    ){
        localStorage.setItem(
            "gemini_api_key",
            rawKeys
        );
    }

    updateKeyStatus();

    showKeyMessage(
        "✅ Gemini API Key အလုပ်လုပ်ပါတယ်။",
        "success"
    );

}catch(error){

    showKeyMessage(
        "❌ Gemini API Error: " +
        error.message,
        "error"
    );
}

}


function cleanScriptText(rawText) {
    if (!rawText) return "";
    return rawText
        .replace(/[\r\n]+/g, ' ')
        .replace(/\s+/g, ' ')
        .replace(/([၊။])\1+/g, '$1')
        .trim();
}

async function trimSilenceFromPCM(pcmUint8Array, sampleRate = 24000) {
    const samplesCount = pcmUint8Array.length / 2;
    if (samplesCount === 0) return pcmUint8Array;

    const float32Array = new Float32Array(samplesCount);
    const dataView = new DataView(pcmUint8Array.buffer, pcmUint8Array.byteOffset, pcmUint8Array.byteLength);

    for (let i = 0; i < samplesCount; i++) {
        const int16 = dataView.getInt16(i * 2, true);
        float32Array[i] = int16 < 0 ? int16 / 32768 : int16 / 32767;
    }

    let start = 0;
    let end = float32Array.length;
    const threshold = 0.015;

    for (let i = 0; i < float32Array.length; i++) {
        if (Math.abs(float32Array[i]) > threshold) {
            start = Math.max(0, i - 240);
            break;
        }
    }

    for (let i = float32Array.length - 1; i >= 0; i--) {
        if (Math.abs(float32Array[i]) > threshold) {
            end = Math.min(float32Array.length, i + 240);
            break;
        }
    }

    if (start >= end) return pcmUint8Array;

    const trimmedSamples = float32Array.subarray(start, end);
    const trimmedPCM = new Uint8Array(trimmedSamples.length * 2);
    const trimmedView = new DataView(trimmedPCM.buffer);

    for (let i = 0; i < trimmedSamples.length; i++) {
        const s = Math.max(-1, Math.min(1, trimmedSamples[i]));
        const val = s < 0 ? s * 32768 : s * 32767;
        trimmedView.setInt16(i * 2, val, true);
    }

    return trimmedPCM;
}
function switchTab(tabName) {
    const singleTab = document.getElementById('singleTab');
    const multiTab = document.getElementById('multiTab');
    const singleBtn = document.getElementById('singleTabBtn');
    const multiBtn = document.getElementById('multiTabBtn');

    if (tabName === 'single') {
        singleTab.style.display = 'block';
        multiTab.style.display = 'none';
        
        singleBtn.style.background = 'rgba(0,210,255,0.2)';
        singleBtn.style.borderColor = '#00d2ff';
        singleBtn.style.color = '#fff';

        multiBtn.style.background = 'rgba(15,23,42,0.8)';
        multiBtn.style.borderColor = 'rgba(255,255,255,0.1)';
        multiBtn.style.color = '#8eb0cb';
    } else {
        singleTab.style.display = 'none';
        multiTab.style.display = 'block';

        multiBtn.style.background = 'rgba(0,210,255,0.2)';
        multiBtn.style.borderColor = '#00d2ff';
        multiBtn.style.color = '#fff';

        singleBtn.style.background = 'rgba(15,23,42,0.8)';
        singleBtn.style.borderColor = 'rgba(255,255,255,0.1)';
        singleBtn.style.color = '#8eb0cb';
    }
}

/* MAIN VOICE GENERATION LOGIC (MULTI-VOICE) */
async function generateVoice(){
    const rawKeys = document.getElementById("apiKey").value.trim();
    const style = document.getElementById("styleSelect").value;
    const speed = document.getElementById("speedSlider").value;
    const format = document.getElementById("formatSelect").value;

    const blockElements = document.querySelectorAll(".speech-block-card");
    if (blockElements.length === 0) {
        showGenerateMessage("📝 Speech Block အနည်းဆုံး တစ်ခု ထည့်ပါ။", "error");
        return;
    }

    let blocksData = [];
    let fullCombinedText = "";
    let primaryVoice = "";

    const isCleanerActive = document.getElementById("cleanerToggle").checked;

    blockElements.forEach((el) => {
        let textVal = el.querySelector(".block-text-input").value.trim();
        const speakerVal = el.getAttribute("data-speaker") || "Charon";

        if (isCleanerActive) {
            textVal = cleanScriptText(textVal);
            el.querySelector(".block-text-input").value = textVal;
        }

        if (textVal) {
            if (!primaryVoice) primaryVoice = speakerVal;
            blocksData.push({ text: textVal, speaker: speakerVal });
            fullCombinedText += `[${speakerVal}]: ${textVal}\n`;
        }
    });

    if (blocksData.length === 0) {
        showGenerateMessage("📝 စကားပြော စာသားများ ရိုက်ထည့်ပါ...", "error");
        return;
    }

    const btn = document.getElementById("generateBtn");

    if(!rawKeys){
        showGenerateMessage("🔑 အရင်ဆုံး Gemini API Key ထည့်ပါ။", "error");
        return;
    }

    const keysList = rawKeys.split(",").map(k => k.trim()).filter(k => k.length > 0);

    btn.disabled = true;
    btn.innerHTML = '<span class="loading"></span>Generating Multi-Voice Audio...';

    document.getElementById("generateMessage").className = "message";
    document.getElementById("result").style.display = "none";

    let speechContentPrompt = blocksData.map(b => `<speaker name="${b.speaker}">${b.text}</speaker>`).join("\n");

    const prompt = `${style}

Clear, natural Burmese conversational tone with friendly, engaging, casual narration.

<speak xml:lang="my-MM">
${speechContentPrompt}
</speak>`;

    const useTemp = document.getElementById("tempToggle").checked;
    const customTemp = useTemp ? parseFloat(document.getElementById("tempSlider").value) : 0.6;

    const body = {
        contents:[{ parts:[{ text:prompt }] }],
        generationConfig:{
            responseModalities:["AUDIO"],
            temperature: customTemp,
            speechConfig:{
                voiceConfig:{
                    prebuiltVoiceConfig:{ voiceName: primaryVoice || "Charon" }
                }
            }
        }
    };

    let success = false;
    let lastError = "";

    for(let i=0; i<keysList.length; i++){
        const currentKey = keysList[i];
        try{
            showGenerateMessage(`🔄 API Key ${i+1}/${keysList.length} ဖြင့် စမ်းနေပါတယ်...`, "info");

            const response = await fetch(API_URL, {
                method:"POST",
                headers:{
                    "Content-Type": "application/json",
                    "x-goog-api-key": currentKey
                },
                body: JSON.stringify(body)
            });

            const data = await response.json().catch(()=>({}));
            if(!response.ok){
                const apiError = data?.error;
                let errorText = apiError?.message || `HTTP ${response.status}`;
                if(apiError?.status) errorText += ` (${apiError.status})`;
                throw new Error(errorText);
            }

            const base64 = data?.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData?.data;
            if(!base64){
                throw new Error("Gemini က Audio Data မပြန်လာပါ။ Response ကို စစ်ပါ။");
            }

            let pcm = base64ToUint8Array(base64);

            if (document.getElementById("trimmerToggle").checked) {
                showGenerateMessage("✂️ အသံနားချိန် Silence များကို ညှပ်ထုတ်နေပါသည်...", "info");
                pcm = await trimSilenceFromPCM(pcm, 24000);
            }

            const wav = pcmToWav(pcm, 24000, 1, 16);
            const blob = new Blob([wav], { type:"audio/wav" });
            currentAudioBlob = blob;

            if(audioURL) URL.revokeObjectURL(audioURL);
            audioURL = URL.createObjectURL(blob);

            const player = document.getElementById("audioPlayer");
            player.src = audioURL;
            player.playbackRate = parseFloat(speed);

            const download = document.getElementById("downloadBtn");
            download.style.display = "block";

            document.getElementById("result").style.display = "block";

            await saveHistoryDB({
                id: Date.now(),
                text: fullCombinedText,
                voice: `Multi (${blocksData.length} speakers)`,
                style: style,
                speed: speed,
                format: format,
                audioBlob: blob,
                date: new Date().toLocaleString()
            });

            showGenerateMessage("✅ အသံဖန်တီးပြီးပါပြီ။", "success");
            success = true;
            break;

        }catch(error){
            lastError = error.message || "Unknown Error";
        }
    }

    if(!success){
        showGenerateMessage("❌ Generate မအောင်မြင်ပါ။\n\nအကြောင်းရင်း:\n" + lastError, "error");
    }

    btn.disabled = false;
    btn.innerHTML = "🔊 Generate Multi-Voice Audio";
}

/* SINGLE-VOICE GENERATION LOGIC */
async function generateSingleVoice(){
    const rawKeys = document.getElementById("apiKey").value.trim();
    const voice = singleVoiceValue;
    let textVal = document.getElementById("singleTextInput").value.trim();
    const style = document.getElementById("singleStyleSelect").value;
    const speed = document.getElementById("singleSpeedSlider").value;
    const format = document.getElementById("formatSelect").value;

    const isCleanerActive = document.getElementById("cleanerToggle").checked;
    if (isCleanerActive) {
        textVal = cleanScriptText(textVal);
        document.getElementById("singleTextInput").value = textVal;
    }

    if (!textVal) {
        showSingleGenerateMessage("📝 ဖတ်ရမည့် စာသား ရိုက်ထည့်ပါ...", "error");
        return;
    }

    if(!rawKeys){
        showSingleGenerateMessage("🔑 အရင်ဆုံး Gemini API Key ထည့်ပါ။", "error");
        return;
    }

    const btn = document.getElementById("singleGenerateBtn");
    const keysList = rawKeys.split(",").map(k => k.trim()).filter(k => k.length > 0);

    btn.disabled = true;
    btn.innerHTML = '<span class="loading"></span>Generating Single-Voice Audio...';

    document.getElementById("singleGenerateMessage").className = "message";
    document.getElementById("singleResult").style.display = "none";

    const prompt = `${style}

Clear, natural Burmese conversational tone with friendly, engaging, casual narration.

<speak xml:lang="my-MM">
<speaker name="${voice}">${textVal}</speaker>
</speak>`;

    const useTemp = document.getElementById("tempToggle").checked;
    const customTemp = useTemp ? parseFloat(document.getElementById("tempSlider").value) : 0.6;

    const body = {
        contents:[{ parts:[{ text:prompt }] }],
        generationConfig:{
            responseModalities:["AUDIO"],
            temperature: customTemp,
            speechConfig:{
                voiceConfig:{
                    prebuiltVoiceConfig:{ voiceName: voice }
                }
            }
        }
    };

    let success = false;
    let lastError = "";

    for(let i=0; i<keysList.length; i++){
        const currentKey = keysList[i];
        try{
            showSingleGenerateMessage(`🔄 API Key ${i+1}/${keysList.length} ဖြင့် စမ်းနေပါတယ်...`, "info");

            const response = await fetch(API_URL, {
                method:"POST",
                headers:{
                    "Content-Type": "application/json",
                    "x-goog-api-key": currentKey
                },
                body: JSON.stringify(body)
            });

            const data = await response.json().catch(()=>({}));
            if(!response.ok){
                const apiError = data?.error;
                let errorText = apiError?.message || `HTTP ${response.status}`;
                if(apiError?.status) errorText += ` (${apiError.status})`;
                throw new Error(errorText);
            }

            const base64 = data?.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData?.data;
            if(!base64){
                throw new Error("Gemini က Audio Data မပြန်လာပါ။ Response ကို စစ်ပါ။");
            }

            let pcm = base64ToUint8Array(base64);

            if (document.getElementById("trimmerToggle").checked) {
                showSingleGenerateMessage("✂️ အသံနားချိန် Silence များကို ညှပ်ထုတ်နေပါသည်...", "info");
                pcm = await trimSilenceFromPCM(pcm, 24000);
            }

            const wav = pcmToWav(pcm, 24000, 1, 16);
            const blob = new Blob([wav], { type:"audio/wav" });

            if(singleAudioURL) URL.revokeObjectURL(singleAudioURL);
            singleAudioURL = URL.createObjectURL(blob);

            const player = document.getElementById("singleAudioPlayer");
            player.src = singleAudioURL;
            player.playbackRate = parseFloat(speed);

            const download = document.getElementById("singleDownloadBtn");
            download.onclick = (e) => {
                e.preventDefault();
                try {
                    const reader = new FileReader();
                    reader.onloadend = function () {
                        const downloadLink = document.createElement("a");
                        downloadLink.href = reader.result;
                        downloadLink.download = `sh_single_audio_${Date.now()}.${format}`;
                        document.body.appendChild(downloadLink);
                        downloadLink.click();
                        document.body.removeChild(downloadLink);
                    };
                    reader.readAsDataURL(blob);
                } catch (err) {
                    window.open(singleAudioURL, "_blank");
                }
            };

            document.getElementById("singleResult").style.display = "block";

            await saveHistoryDB({
                id: Date.now(),
                text: textVal,
                voice: voice,
                style: style,
                speed: speed,
                format: format,
                audioBlob: blob,
                date: new Date().toLocaleString()
            });

            showSingleGenerateMessage("✅ အသံဖန်တီးပြီးပါပြီ။", "success");
            success = true;
            break;

        }catch(error){
            lastError = error.message || "Unknown Error";
        }
    }

    if(!success){
        showSingleGenerateMessage("❌ Generate မအောင်မြင်ပါ။\n\nအကြောင်းရင်း:\n" + lastError, "error");
    }

    btn.disabled = false;
    btn.innerHTML = "🔊 Generate Single-Voice Audio";
}

// Download Button Click Handler
function triggerDownload(e) {
    if (e) e.preventDefault();
    if (!currentAudioBlob) return;

    const format = document.getElementById("formatSelect").value || "wav";
    const reader = new FileReader();
    reader.onloadend = function() {
        const base64Data = reader.result;
        const a = document.createElement('a');
        a.href = base64Data;
        a.download = `sh_multi_audio_${Date.now()}.${format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };
    reader.readAsDataURL(currentAudioBlob);
}

/* HELPER FUNCTIONS */
function base64ToUint8Array(base64){
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for(let i=0; i<binary.length; i++){
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
}

function pcmToWav(pcmData, sampleRate, channels, bitDepth){
    const bytesPerSample = bitDepth / 8;
    const blockAlign = channels * bytesPerSample;
    const buffer = new ArrayBuffer(44 + pcmData.length);
    const view = new DataView(buffer);

    writeString(view, 0, "RIFF");
    view.setUint32(4, 36 + pcmData.length, true);
    writeString(view, 8, "WAVE");
    writeString(view, 12, "fmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, channels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * blockAlign, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitDepth, true);
    writeString(view, 36, "data");
    view.setUint32(40, pcmData.length, true);

    new Uint8Array(buffer, 44).set(pcmData);
    return buffer;
}

function writeString(view, offset, string){
    for(let i=0; i<string.length; i++){
        view.setUint8(offset + i, string.charCodeAt(i));
    }
}
  function switchView(viewId, element) {
    // ၁။ View အားလုံးကို ဖျောက်မယ်
    document.querySelectorAll('.view-container').forEach(el => {
        el.style.display = 'none';
    });
    
    // ၂။ ရွေးလိုက်တဲ့ View ကို ဖော်မယ်
    const targetView = document.getElementById(viewId);
    if (targetView) {
        targetView.style.display = 'block';
    }

    // ၃။ Navigation ခလုတ်တွေ အားလုံးကို မူလအရောင် (မီးခိုးပြာရောင်) ပြန်ပြောင်းမယ်
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.style.color = '#8eb0cb';
    });

    // ၄။ အခု နှိပ်လိုက်တဲ့ ခလုတ်ကိုပဲ အပြာရောင် (Active) ဖြစ်စေမယ်
    if (element) {
    element.style.color = '#00baff';
}

    if (viewId === 'voiceGenerator' || viewId === 'generator') {
    shRenderVoiceLibrary();
}
  }
function showGenerateMessage(text, type){
    const box = document.getElementById("generateMessage");
    box.textContent = text;
    box.className = "message " + type;
}

function showSingleGenerateMessage(text, type){
    const box = document.getElementById("singleGenerateMessage");
    box.textContent = text;
    box.className = "message " + type;
}

/* INDEXEDDB STORAGE */
const DB_NAME = "VoiceStudioDB";
const DB_VERSION = 1;
const STORE_NAME = "audio_history";

function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: "id" });
            }
        };
        request.onsuccess = (e) => resolve(e.target.result);
        request.onerror = (e) => reject(e.target.error);
    });
}

async function saveHistoryDB(item) {
    try {
        const db = await openDB();
        const tx = db.transaction(STORE_NAME, "readwrite");
        const store = tx.objectStore(STORE_NAME);
        await new Promise((resolve, reject) => {
            const req = store.put(item);
            req.onsuccess = resolve;
            req.onerror = reject;
        });
    } catch (err) {
        console.error("IndexedDB Save Error:", err);
    }
}

async function getHistoryDB() {
    try {
        const db = await openDB();
        const tx = db.transaction(STORE_NAME, "readonly");
        const store = tx.objectStore(STORE_NAME);
        return new Promise((resolve, reject) => {
            const req = store.getAll();
            req.onsuccess = () => resolve(req.result.sort((a,b) => b.id - a.id));
            req.onerror = reject;
        });
    } catch (err) {
        console.error("IndexedDB Get Error:", err);
        return [];
    }
}

async function deleteHistoryItem(id) {
    try {
        const db = await openDB();
        const tx = db.transaction(STORE_NAME, "readwrite");
        const store = tx.objectStore(STORE_NAME);
        await new Promise((resolve, reject) => {
            const req = store.delete(id);
            req.onsuccess = resolve;
            req.onerror = reject;
        });
        renderHistory();
    } catch (err) {
        console.error("IndexedDB Delete Error:", err);
    }
}

async function clearHistory() {
    const history = await getHistoryDB();
    if(history.length === 0) return;
    if(!confirm("History အားလုံးကို ဖျက်မှာ သေချာပါသလား?")) return;

    try {
        const db = await openDB();
        const tx = db.transaction(STORE_NAME, "readwrite");
        const store = tx.objectStore(STORE_NAME);
        await new Promise((resolve, reject) => {
            const req = store.clear();
            req.onsuccess = resolve;
            req.onerror = reject;
        });
        renderHistory();
    } catch (err) {
        console.error("IndexedDB Clear Error:", err);
    }
}

async function renderHistory() {
    const list = document.getElementById("modalHistoryList");
    if (!list) return;

    const history = await getHistoryDB();

    if (history.length === 0) {
        list.innerHTML = `<div class="empty-history">📭 History မရှိသေးပါ</div>`;
        return;
    }

    list.innerHTML = history.map(item => {
        let audioSrc = "";
        if(item.audioBlob) {
            audioSrc = URL.createObjectURL(item.audioBlob);
        }

        return `
            <div class="history-item">
                <div class="history-top">
                    <div class="history-title">🎙️ Voice #${item.id}</div>
                    <div class="history-date">${escapeHTML(item.date)}</div>
                </div>

                <div class="history-text">${escapeHTML(item.text)}</div>

                <div class="history-info">
                    🎙️ ${escapeHTML(item.voice || "Multi-Voice")} &nbsp;|&nbsp;
                    ⚡ ${escapeHTML(item.speed)}x &nbsp;|&nbsp;
                    📁 ${escapeHTML((item.format || "wav").toUpperCase())}
                </div>

                ${audioSrc ? `<audio controls src="${audioSrc}" style="width:100%; margin-top:8px;"></audio>` : ''}

                <div class="history-buttons">
                    ${audioSrc ? `<a class="history-btn" style="text-align:center; text-decoration:none;" href="${audioSrc}" download="sh_audio_${item.id}.${item.format || 'wav'}">⬇️ Save</a>` : ''}

                    <button class="history-btn history-delete" style="grid-column: span 2;" onclick="deleteHistoryItem(${item.id})">
                        🗑️ Delete
                    </button>
                </div>
            </div>
        `;
    }).join("");
}

function escapeHTML(value){
    return String(value)
        .replace(/&/g,"&amp;")
        .replace(/</g,"&lt;")
        .replace(/>/g,"&gt;")
        .replace(/"/g,"&quot;")
        .replace(/'/g,"&#039;");
}

/* ================= SH PREMIUM VOICE DEMO CACHE ================= */
const SH_DEMO_DB = 'SHVoiceDemoDB';
const SH_DEMO_VERSION = 1;
const SH_DEMO_STORE = 'voice_demos';
const SH_DEMO_TEXT = {
  Puck: 'မင်္ဂလာပါ၊ ကျွန်တော့်နာမည်ကတော့ ပတ်ခ်ပါ။',
  Charon: 'မင်္ဂလာပါ၊ ကျွန်တော့်နာမည်ကတော့ ချာကွန်ပါ။',
  Fenrir: 'မင်္ဂလာပါ၊ ကျွန်တော့်နာမည်ကတော့ ဖန်နီယာပါ။',
  Orus: 'မင်္ဂလာပါ၊ ကျွန်တော့်နာမည်ကတော့ အိုရပ်စ်ပါ။',
  Kore: 'မင်္ဂလာပါ၊ ကျွန်မနာမည်ကတော့ ကိုးရီးပါ။',
  Leda: 'မင်္ဂလာပါ၊ ကျွန်မနာမည်ကတော့ လီဒါပါ။',
  Aoede: 'မင်္ဂလာပါ၊ ကျွန်မနာမည်ကတော့ အော်ဒီပါ။',
  Callirrhoe: 'မင်္ဂလာပါ၊ ကျွန်မနာမည်ကတော့ ကလီရိုးပါ။',
  Despina: 'မင်္ဂလာပါ၊ ကျွန်မနာမည်ကတော့ ဒက်စပီနာပါ။'
};
const SH_VOICES = [
  ['Charon','တည်ငြိမ်ပြီး ရှင်းလင်းတဲ့ အသံ','charon.jpg'],
  ['Puck','တက်ကြွလှုပ်ရှား လူငယ်သံ','puck.jpg'],
  ['Fenrir','စိတ်လှုပ်ရှားဖွယ် ဇာတ်လမ်းသံ','fenrir.jpg'],
  ['Orus','ပြတ်သားခိုင်မာ ရင့်ကျက်သံ','orus.jpg'],
  ['Kore','ပြတ်သားခိုင်မာ လူငယ်သံ','kore.jpg'],
  ['Leda','နုပျိုတက်ကြွ ချိုသာသံ','leda.jpg'],
  ['Aoede','ပေါ့ပါးလန်းဆန်း စကားပြောသံ','aoede.jpg'],
  ['Callirrhoe','အေးဆေးပေါ့ပါး သဘာဝသံ','callirrhoe.jpg'],
  ['Despina','ချောမွေ့ငြိမ့်ညောင်း ဇာတ်လမ်းသံ','despina.jpg']
];
function shOpenDemoDB(){
  return new Promise((resolve,reject)=>{
    const r=indexedDB.open(SH_DEMO_DB,SH_DEMO_VERSION);
    r.onupgradeneeded=e=>{const db=e.target.result;if(!db.objectStoreNames.contains(SH_DEMO_STORE))db.createObjectStore(SH_DEMO_STORE,{keyPath:'voice'});};
    r.onsuccess=()=>resolve(r.result); r.onerror=()=>reject(r.error);
  });
}
async function shGetDemo(voice){
  const db=await shOpenDemoDB();
  return new Promise((resolve,reject)=>{const tx=db.transaction(SH_DEMO_STORE,'readonly');const r=tx.objectStore(SH_DEMO_STORE).get(voice);r.onsuccess=()=>resolve(r.result||null);r.onerror=()=>reject(r.error);});
}
async function shSaveDemo(voice,blob){
  const db=await shOpenDemoDB();
  return new Promise((resolve,reject)=>{const tx=db.transaction(SH_DEMO_STORE,'readwrite');tx.objectStore(SH_DEMO_STORE).put({voice,blob,createdAt:Date.now()});tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);});
}
function shMarkCached(voice,cached=true){
  const card=document.querySelector(`.premium-voice-card[data-voice="${voice}"]`);
  if(card)card.classList.toggle('cached',cached);
  const btn=card?.querySelector('.preview');
  if(btn && cached)btn.textContent='▶ Play';
}
async function shRefreshCacheMarks(){
  for(const [voice] of SH_VOICES){try{if(await shGetDemo(voice))shMarkCached(voice,true);}catch(e){}}
}
function shRenderVoiceLibrary(){
    const grid = document.getElementById('premiumVoiceGrid');
    if(!grid) return;

    grid.innerHTML = SH_VOICES.map(([voice, desc, img]) => {
        return `<article class="voice-card premium-voice-card" data-voice="${voice}" style="box-sizing: border-box;">
            <div class="voice-avatar-wrap" onclick="shChooseVoice('${voice}')">
                <img src="${img}" alt="${voice}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">
            </div>

            <div class="voice-name-row" onclick="shChooseVoice('${voice}')">
                <strong>${voice}</strong>
                <span style="font-size: 9px; color: #00baff;">GEMINI TTS</span>
            </div>

            <div class="voice-desc" onclick="shChooseVoice('${voice}')">${desc}</div>

            <div style="display:flex; gap:5px; margin-top:10px; width:100%; box-sizing:border-box;">

                <button
                    class="btn preview"
                    onclick="shPreviewVoice('${voice}', this)"
                    style="flex:1; padding:7px 2px; background:rgba(0,186,255,0.2); border:1px solid #00baff; border-radius:8px; color:#fff; cursor:pointer; font-size:11px; text-align:center;">
                    ▶ Play
                </button>

                <button
                    class="btn use"
                    onclick="shChooseVoice('${voice}')"
                    style="flex:1; padding:7px 2px; background:rgba(0,255,136,0.2); border:1px solid #00ff88; border-radius:8px; color:#fff; cursor:pointer; font-size:11px; text-align:center;">
                    Use
                </button>

            </div>
        </article>`;
    }).join('');
}
async function shDownloadDemo(voice, button){
    try{
        const cached = await shGetDemo(voice);

        if(!cached?.blob){
            alert('အရင်ဆုံး Preview ကိုနှိပ်ပြီး အသံဖန်တီးပေးပါ။');
            return;
        }

        const url = URL.createObjectURL(cached.blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `SH-${voice}-Preview.wav`;
        document.body.appendChild(a);
        a.click();
        a.remove();

        setTimeout(() => URL.revokeObjectURL(url), 1000);

    }catch(e){
        alert('Download မအောင်မြင်ပါ။\n\n' + (e.message || e));
    }
}
const SH_LOCAL_VOICE_FILES = {
    Puck: 'Puck.wav',
    Charon: 'Charon.wav',
    Fenrir: 'Fenrir.mp3',
    Orus: 'Orus.wav',
    Kore: 'Kore.wav',
    Leda: 'Leda.wav',
    Aoede: 'Aoede.wav',
    Callirrhoe: 'Callirrhoe.wav',
    Despina: 'Despina.wav'
};

let shVoiceAudio = null;
let shPlayingButton = null;

function shPreviewVoice(voice, button){
    try{
        const src = SH_LOCAL_VOICE_FILES[voice];

        if(!src){
            alert('ဒီအသံဖိုင် မတွေ့ပါ။');
            return;
        }

        // အရင်ဖွင့်နေတဲ့အသံရှိရင် ရပ်
        if(shVoiceAudio){
            shVoiceAudio.pause();
            shVoiceAudio.currentTime = 0;

            if(shPlayingButton){
                shPlayingButton.textContent = '▶ Play';
            }
        }

        // Local audio file ကို တိုက်ရိုက်ဖွင့်
        shVoiceAudio = new Audio('./' + src);
        shPlayingButton = button;

        button.textContent = '🇲🇲 Stop';

        shVoiceAudio.onended = () => {
            button.textContent = '▶ Play';
            shVoiceAudio = null;
            shPlayingButton = null;
        };

        shVoiceAudio.onerror = () => {
            button.textContent = '▶ Play';
            shVoiceAudio = null;
            shPlayingButton = null;

            alert(
                'အသံဖိုင် ဖွင့်မရပါ။\n\n' +
                'File name ကို စစ်ပေးပါ။\n' +
                'ဥပမာ - Charon.wav'
            );
        };

        shVoiceAudio.play().catch(() => {
            button.textContent = '▶ Play';
        });

    }catch(e){
        button.textContent = '▶ Play';

        alert(
            'အသံဖိုင် ဖွင့်မရပါ။\n\n' +
            (e.message || e)
        );
    }
}

function shRenderVoiceLibrary(){
    const grid = document.getElementById('premiumVoiceGrid');
    if(!grid) return;

    grid.innerHTML = SH_VOICES.map(([voice, desc, img]) => {
        return `<article class="voice-card premium-voice-card" data-voice="${voice}" style="box-sizing: border-box;">

            <div class="voice-avatar-wrap" onclick="shChooseVoice('${voice}')">
                <img src="${img}" alt="${voice}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">
            </div>

            <div class="voice-name-row" onclick="shChooseVoice('${voice}')">
                <strong>${voice}</strong>
                <span style="font-size: 9px; color: #00baff;">GEMINI TTS</span>
            </div>

            <div class="voice-desc" onclick="shChooseVoice('${voice}')">${desc}</div>

            <div style="display:flex; gap:5px; margin-top:10px; width:100%; box-sizing:border-box;">

                <button
                    class="btn preview"
                    onclick="shPreviewVoice('${voice}', this)"
                    style="flex:1; padding:7px 2px; background:rgba(0,186,255,0.2); border:1px solid #00baff; border-radius:8px; color:#fff; cursor:pointer; font-size:11px; text-align:center;">
                    ▶ Play
                </button>

                <button
                    class="btn use"
                    onclick="shChooseVoice('${voice}')"
                    style="flex:1; padding:7px 2px; background:rgba(0,255,136,0.2); border:1px solid #00ff88; border-radius:8px; color:#fff; cursor:pointer; font-size:11px; text-align:center;">
                    Use
                </button>

            </div>

        </article>`;
    }).join('');
}

window.addEventListener('DOMContentLoaded', () => {
    shRenderVoiceLibrary();
    switchView('mainDashboard');
});
// Custom Neon Glass Alert Function
function showNeonAlert(message) {
    const oldAlert = document.getElementById('shNeonAlertModal');
    if (oldAlert) oldAlert.remove();

    const alertHtml = `
        <div id="shNeonAlertModal" class="sh-neon-alert-overlay">
            <div class="sh-neon-alert-box">
                <p>${message}</p>
                <button class="sh-neon-alert-btn" onclick="document.getElementById('shNeonAlertModal').remove()">OK</button>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', alertHtml);
}

// 1. Neon Glass Notification UI ဖန်တီးပေးမည့် Function
function showNeonAlert(msg) {
    let noticeBox = document.getElementById('neonAlertNotice');
    if (!noticeBox) {
        noticeBox = document.createElement('div');
        noticeBox.id = 'neonAlertNotice';
        noticeBox.style.cssText = `
            position: fixed; bottom: 35px; left: 50%; transform: translateX(-50%);
            background: rgba(15, 23, 42, 0.95); border: 1px solid #00d2ff;
            color: #fff; padding: 12px 24px; border-radius: 14px;
            box-shadow: 0 0 25px rgba(0, 210, 255, 0.45); font-size: 13px; font-weight: bold;
            z-index: 99999; backdrop-filter: blur(12px); display: flex; align-items: center; gap: 10px;
            transition: all 0.3s ease; opacity: 0; pointer-events: none;
        `;
        document.body.appendChild(noticeBox);
    }
    
    noticeBox.innerHTML = `<span>✨</span> <span>${msg}</span>`;
    noticeBox.style.opacity = '1';
    noticeBox.style.transform = 'translateX(-50%) translateY(-5px)';
    
    setTimeout(() => {
        noticeBox.style.opacity = '0';
        noticeBox.style.transform = 'translateX(-50%) translateY(0px)';
    }, 2800);
}

// 2. Browser ရဲ့ ရိုးရိုး alert() အားလုံးကို Neon Alert သို့ အလိုအလျောက် ပြောင်းပစ်ခြင်း
window.alert = function(message) {
    showNeonAlert(message);
};

// ဇာတ်လမ်းအချက်အလက်များကို Browser ထဲ သိမ်းရန်
function saveStoryMemory() {
    localStorage.setItem('myMovieStoryMemory', JSON.stringify(storyMemory));
}

// App စဖွင့်ချိန်တွင် ယခင် ဇာတ်လမ်းများကို ပြန်ဆွဲထုတ်ရန်
function loadStoryMemory() {
    const saved = localStorage.getItem('myMovieStoryMemory');
    if (saved) {
        storyMemory = JSON.parse(saved);
    }
}

// ဇာတ်ကားအသစ် စတင်လိုပါက Memory ရှင်းထုတ်ရန်
function resetStory() {
    if (confirm("ဇာတ်လမ်းဟောင်းကို ဖျက်ပြီး ဇာတ်ကားအသစ် စတင်မှာ သေချာပါသလား။")) {
        storyMemory = { scenes: [] }; 
        localStorage.removeItem('myMovieStoryMemory');
        renderMultiSceneCards(); 
        alert("ဇာတ်လမ်းဟောင်း ဖျက်ပြီးပါပြီ။");
    }
}

// App စတင်ပွင့်သည်နှင့် Automatic ခေါ်ပေးမည်
loadStoryMemory();

// Scene တစ်ခုလုံး (Voiceover + English Prompt) ကို တစ်ခါတည်း Copy ကူးမည့် Function
function copyFullScene(sceneNum, voiceoverText, flowPromptText) {
    const fullText = `--- Scene ${sceneNum} ---
[Voiceover]:
${voiceoverText}

[Flow Prompt]:
${flowPromptText}`;

    navigator.clipboard.writeText(fullText).then(() => {
        alert(`Scene ${sceneNum} တစ်ခုလုံးကို Copy ကူးပြီးပါပြီ!`);
    }).catch(err => {
        console.error('Copy Error:', err);
    });
}
// Scene တစ်ခုလုံး (Voiceover + Flow Prompt) ကို တစ်ခါတည်း Copy ကူးမည့် Function
function copyFullScene(sceneNum, voiceoverText, flowPromptText) {
    const fullText = `--- Scene ${sceneNum} ---
[Voiceover]:
${voiceoverText}

[Flow Prompt]:
${flowPromptText}`;

    navigator.clipboard.writeText(fullText).then(() => {
        alert(`Scene ${sceneNum} တစ်ခုလုံးကို Copy ကူးပြီးပါပြီ!`);
    }).catch(err => {
        console.error('Copy Error:', err);
    });
}
document.getElementById('processAudioBtn').addEventListener('click', async () => {
    const fileInput = document.getElementById('audioFileInput');
    if (fileInput.files.length === 0) {
        alert('ကျေးဇူးပြု၍ အသံဖိုင်တစ်ခု ရွေးချယ်ပါ သားရီး!');
        return;
    }

    const file = fileInput.files[0];
    const arrayBuffer = await file.arrayBuffer();
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

    // Silence Removal Logic
    const channelData = audioBuffer.getChannelData(0); // Mono channel ယူမည်
    const sampleRate = audioBuffer.sampleRate;
    
    // ချိန်ညှိချက်များ (Threshold နဲ့ Min Duration)
    const silenceThreshold = 0.02; // ဒီပမာဏထက် ငြိမ်ရင် အသံတိတ်ဟု သတ်မှတ်မည်
    const minSilenceSamples = sampleRate * 0.3; // 0.3 စက္ကန့်ထက်ပို၍ တိတ်မှ ဖြတ်မည်

    let nonSilentChunks = [];
    let start = null;

    for (let i = 0; i < channelData.length; i++) {
        const absValue = Math.abs(channelData[i]);
        if (absValue > silenceThreshold) {
            if (start === null) start = i;
        } else {
            if (start !== null) {
                if (i - start > minSilenceSamples) {
                    nonSilentChunks.push({ start: start, end: i });
                    start = null;
                }
            }
        }
    }
    if (start !== null) {
        nonSilentChunks.push({ start: start, end: channelData.length });
    }

    // အသံအပိုင်းအစများကို ပြန်လည်စုစည်းခြင်း
    let totalLength = nonSilentChunks.reduce((acc, chunk) => acc + (chunk.end - chunk.start), 0);
    const newAudioBuffer = audioCtx.createBuffer(audioBuffer.numberOfChannels, totalLength, sampleRate);

    for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
        let newChannelData = newAudioBuffer.getChannelData(channel);
        let offset = 0;
        const sourceData = audioBuffer.getChannelData(channel);
        
        nonSilentChunks.forEach(chunk => {
            let length = chunk.end - chunk.start;
            newChannelData.set(sourceData.subarray(chunk.start, chunk.end), offset);
            offset += length;
        });
    }

    // WAV ဖိုင်အဖြစ် ပြောင်းလဲခြင်း
    const wavBlob = bufferToWave(newAudioBuffer, totalLength);
    const audioUrl = URL.createObjectURL(wavBlob);

    // Audio Player နဲ့ Download Link ချိတ်ပေးခြင်း
    const audioElement = document.getElementById('outputAudio');
    audioElement.src = audioUrl;
    audioElement.style.display = 'block';

    const downloadLink = document.getElementById('downloadAudioLink');
    downloadLink.href = audioUrl;
    downloadLink.download = 'cleaned_voiceover.wav';
    downloadLink.style.display = 'inline-block';
    
    alert('အသံတိတ်ကွက်များ အောင်မြင်စွာ ဖယ်ရှားပြီးပါပြီ သားရီး!');
});

// AudioBuffer ကို WAV Blob သို့ ပြောင်းပေးသည့် Helper Function
function bufferToWave(abuffer, len) {
    let numOfChan = abuffer.numberOfChannels,
        length = len * numOfChan * 2 + 44,
        buffer = new ArrayBuffer(length),
        view = new DataView(buffer),
        channels = [], i, sample,
        offset = 0,
        pos = 0;

    function setUint16(data) {
        view.setUint16(pos, data, true);
        pos += 2;
    }

    function setUint32(data) {
        view.setUint32(pos, data, true);
        pos += 4;
    }

    setUint32(0x46464952); // "RIFF"
    setUint32(length - 8); // file length - 8
    setUint32(0x45564157); // "WAVE"

    setUint32(0x20746d66); // "fmt " chunk
    setUint32(16); // length = 16
    setUint16(1); // PCM (uncompressed)
    setUint16(numOfChan);
    setUint32(abuffer.sampleRate);
    setUint32(abuffer.sampleRate * 2 * numOfChan); // avg. bytes/sec
    setUint16(numOfChan * 2); // block-align
    setUint16(16); // 16-bit

    setUint32(0x61746164); // "data" - chunk
    setUint32(length - pos - 4); // data length

    for (i = 0; i < abuffer.numberOfChannels; i++)
        channels.push(abuffer.getChannelData(i));

    while (offset < len) {
        for (i = 0; i < numOfChan; i++) {
            sample = Math.max(-1, Math.min(1, channels[i][offset]));
            sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767);
            view.setInt16(pos, sample, true);
            pos += 2;
        }
        offset++;
    }

    return new Blob([buffer], { type: "audio/wav" });
}
