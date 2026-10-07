/* =========================================================
   SH AI CHAT — COMPLETE JAVASCRIPT
   ========================================================= */


/* =========================================================
   GLOBAL STATE
   ========================================================= */

let shChatHistory = [];

let shAttachedImage = null;
let shAttachedFileText = null;

let shCurrentChatKeyIndex = 0;


/* =========================================================
   API KEY SYSTEM
   Supports:
   key1,key2,key3,key4
   ========================================================= */

function shGetAllChatApiKeys() {

    const input = document.getElementById("apiKey");

    let raw = "";

    if (input && input.value.trim()) {
        raw = input.value.trim();
    } else {
        raw = localStorage.getItem("gemini_api_key") || "";
    }

    if (!raw) {
        return [];
    }

    return raw
        .split(",")
        .map(key => key.trim())
        .filter(Boolean);
}


function shGetChatApiKey() {

    const keys = shGetAllChatApiKeys();

    if (!keys.length) {
        return "";
    }

    if (shCurrentChatKeyIndex >= keys.length) {
        shCurrentChatKeyIndex = 0;
    }

    return keys[shCurrentChatKeyIndex];
}


function shMoveToNextChatKey() {

    const keys = shGetAllChatApiKeys();

    if (keys.length <= 1) {
        return false;
    }

    if (shCurrentChatKeyIndex < keys.length - 1) {

        shCurrentChatKeyIndex++;

        return true;
    }

    return false;
}


function shResetChatKeyRotation() {

    shCurrentChatKeyIndex = 0;
}


/* =========================================================
   ATTACH MENU
   ========================================================= */

function toggleAttachMenu() {

    const menu = document.getElementById("attachMenu");

    if (!menu) return;

    const current =
        window.getComputedStyle(menu).display;

    if (current === "none") {

        menu.style.setProperty(
            "display",
            "block",
            "important"
        );

    } else {

        menu.style.setProperty(
            "display",
            "none",
            "important"
        );
    }
}


function shCloseAttachMenu() {

    const menu = document.getElementById("attachMenu");

    if (!menu) return;

    menu.style.setProperty(
        "display",
        "none",
        "important"
    );
}


/* =========================================================
   IMAGE ATTACH
   ========================================================= */

function handleChatImage(event) {

    const file =
        event?.target?.files?.[0];

    if (!file) return;


    if (!file.type.startsWith("image/")) {

        alert("Image ဖိုင်ပဲ ရွေးပါ။");

        return;
    }


    const reader = new FileReader();


    reader.onload = function(e) {

        const result = e.target.result;

        if (!result) return;


        shAttachedImage = {

            mimeType: file.type,

            data:
                result
                .split(",")[1],

            name: file.name
        };


        shAttachedFileText = null;


        const previewBox =
            document.getElementById(
                "imagePreviewContainer"
            );

        const preview =
            document.getElementById(
                "selectedImagePreview"
            );

        const name =
            document.getElementById(
                "imageFileName"
            );


        if (preview) {

            preview.style.display = "block";

            preview.src = result;
        }


        if (name) {

            name.textContent =
                file.name;
        }


        if (previewBox) {

            previewBox.style.display =
                "flex";
        }
    };


    reader.readAsDataURL(file);

    shCloseAttachMenu();
}


/* =========================================================
   FILE ATTACH
   TXT / MD
   ========================================================= */

function handleChatFile(event) {

    const file =
        event?.target?.files?.[0];

    if (!file) return;


    const isTextFile =
        file.type.startsWith("text/") ||
        file.name.toLowerCase().endsWith(".txt") ||
        file.name.toLowerCase().endsWith(".md");


    if (!isTextFile) {

        alert(
            "ဒီ version မှာ TXT / MD ဖိုင်တွေကိုပဲ ဖတ်နိုင်သေးပါတယ်။"
        );

        if (event.target) {
            event.target.value = "";
        }

        shCloseAttachMenu();

        return;
    }


    const reader =
        new FileReader();


    reader.onload = function(e) {

        shAttachedFileText = {

            name: file.name,

            text: e.target.result || ""
        };


        shAttachedImage = null;


        const previewBox =
            document.getElementById(
                "imagePreviewContainer"
            );

        const name =
            document.getElementById(
                "imageFileName"
            );

        const preview =
            document.getElementById(
                "selectedImagePreview"
            );


        if (preview) {

            preview.style.display =
                "none";

            preview.removeAttribute(
                "src"
            );
        }


        if (name) {

            name.textContent =
                "📄 " + file.name;
        }


        if (previewBox) {

            previewBox.style.display =
                "flex";
        }
    };


    reader.readAsText(file);

    shCloseAttachMenu();
}


/* =========================================================
   REMOVE ATTACHMENT
   ========================================================= */

function removeAttachedImage() {

    shAttachedImage = null;

    shAttachedFileText = null;


    const previewBox =
        document.getElementById(
            "imagePreviewContainer"
        );

    const imageInput =
        document.getElementById(
            "chatImageInput"
        );

    const fileInput =
        document.getElementById(
            "chatFileInput"
        );

    const preview =
        document.getElementById(
            "selectedImagePreview"
        );


    if (previewBox) {

        previewBox.style.display =
            "none";
    }


    if (preview) {

        preview.removeAttribute(
            "src"
        );

        preview.style.display =
            "";
    }


    if (imageInput) {

        imageInput.value = "";
    }


    if (fileInput) {

        fileInput.value = "";
    }
}


/* =========================================================
   ADD AI MESSAGE
   ========================================================= */

function shAddChatMessage(
    text,
    type = "ai"
) {

    const container =
        document.getElementById(
            "chatMessages"
        );

    if (!container) {
        return null;
    }


    /* ================= USER ================= */

    if (type === "user") {

        const row =
            document.createElement("div");

        row.className =
            "sh-message-row user";


        const content =
            document.createElement("div");

        content.className =
            "sh-message-content";


        const bubble =
            document.createElement("div");

        bubble.className =
            "sh-user-bubble";


        bubble.textContent =
            text;


        content.appendChild(
            bubble
        );

        row.appendChild(
            content
        );

        container.appendChild(
            row
        );


        shScrollChatToBottom();


        return bubble;
    }


    /* ================= AI ================= */

    const row =
        document.createElement("div");

    row.className =
        "sh-message-row ai";


    const avatar =
        document.createElement("div");

    avatar.className =
        "sh-message-avatar";

    avatar.textContent =
        "SH";


    const content =
        document.createElement("div");

    content.className =
        "sh-message-content";


    const name =
        document.createElement("div");

    name.className =
        "sh-message-name";

    name.innerHTML =
        'SH AI <span>AI Assistant</span>';


    const bubble =
        document.createElement("div");

    bubble.className =
        "sh-ai-bubble";

    bubble.textContent =
        text;


    const time =
        document.createElement("div");

    time.className =
        "sh-message-time";

    time.textContent =
        "Just now";


    content.appendChild(
        name
    );

    content.appendChild(
        bubble
    );

    content.appendChild(
        time
    );


    row.appendChild(
        avatar
    );

    row.appendChild(
        content
    );


    container.appendChild(
        row
    );


    shScrollChatToBottom();


    return bubble;
}


/* =========================================================
   SCROLL CHAT
   ========================================================= */

function shScrollChatToBottom() {

    const container =
        document.getElementById(
            "chatMessages"
        );

    if (!container) return;


    requestAnimationFrame(() => {

        container.scrollTo({

            top:
                container.scrollHeight,

            behavior:
                "smooth"
        });

    });
}


/* =========================================================
   LOADING MESSAGE
   ========================================================= */

function shAddLoadingMessage() {

    return shAddChatMessage(
        "⏳ SH AI စဉ်းစားနေပါတယ်...",
        "ai"
    );
}


/* =========================================================
   SEND CHAT MESSAGE
   ========================================================= */

async function sendChatMessage() {

    const input =
        document.getElementById(
            "chatInput"
        );

    if (!input) return;


    const text =
        input.value.trim();


    if (
        !text &&
        !shAttachedImage &&
        !shAttachedFileText
    ) {

        return;
    }


    const keys =
        shGetAllChatApiKeys();


    if (!keys.length) {

        shAddChatMessage(
            "🔑 API Key မတွေ့ပါဘူး။ Settings မှာ Gemini API Key ထည့်ပေးပါ။",
            "ai"
        );

        return;
    }


    let displayText =
        text;


    if (shAttachedImage) {

        displayText +=
            (displayText ? "\n" : "") +
            "🖼️ " +
            shAttachedImage.name;
    }


    if (shAttachedFileText) {

        displayText +=
            (displayText ? "\n" : "") +
            "📄 " +
            shAttachedFileText.name;
    }


    /* USER MESSAGE */

    shAddChatMessage(
        displayText,
        "user"
    );


    input.value = "";


    /* LOADING */

    const loadingBubble =
        shAddLoadingMessage();


    /* BUILD PARTS */

    const parts = [];


    if (text) {

        parts.push({

            text: text
        });
    }


    if (shAttachedImage) {

        parts.push({

            inline_data: {

                mime_type:
                    shAttachedImage.mimeType,

                data:
                    shAttachedImage.data
            }
        });
    }


    if (shAttachedFileText) {

        parts.push({

            text:
                "\n\nAttached file: " +
                shAttachedFileText.name +
                "\n\n" +
                shAttachedFileText.text
        });
    }


    /* SAVE USER HISTORY */

    shChatHistory.push({

        role: "user",

        parts: parts
    });


    let success =
        false;

    let lastError =
        null;


    /*
       Try current key.
       If quota / invalid / unavailable,
       automatically move to next key.
    */

    while (
        shCurrentChatKeyIndex <
        keys.length
    ) {

        const apiKey =
            shGetChatApiKey();


        if (!apiKey) {

            break;
        }


        try {

            const response =
                await fetch(
                    "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent",
                   {
                        method:
                            "POST",

                        headers: {

                            "Content-Type":
                                "application/json",

                            "x-goog-api-key":
                                apiKey
                        },

                        body:
                            JSON.stringify({

                                systemInstruction: {

                                    parts: [{

                                        text:
                                            "You are SH AI TEAM, the helpful AI assistant inside SH AI Studio. " +
                                            "Answer clearly and naturally. " +
                                            "When the user speaks Burmese, reply naturally in Burmese. " +
                                            "Do not mention internal API details unless asked."
                                    }]
                                },


                                contents:
                                    shChatHistory,


                                generationConfig: {

                                    temperature:
                                        0.7,

                                    maxOutputTokens:
                                        2048
                                }

                            })
                    }
                );


            const data =
                await response.json();


            if (!response.ok) {

                throw new Error(
                    data?.error?.message ||
                    "Gemini API Error"
                );
            }


            const answer =
                data
                    ?.candidates?.[0]
                    ?.content?.parts
                    ?.map(
                        p => p.text || ""
                    )
                    .join("") ||
                "AI က အဖြေပြန်မပေးနိုင်သေးပါဘူး။";


            /* UPDATE LOADING */

            if (loadingBubble) {

                loadingBubble.textContent =
                    answer;
            }


            /* SAVE MODEL */

            shChatHistory.push({

                role: "model",

                parts: [{

                    text:
                        answer
                }]
            });


            success =
                true;


            /*
               Successful key stays active.
            */

            break;


        } catch (error) {

            lastError =
                error;


            console.warn(
                "SH AI KEY ERROR:",
                shCurrentChatKeyIndex + 1,
                error
            );


            /*
               Try next key.
            */

            if (!shMoveToNextChatKey()) {

                break;
            }
        }
    }


    /* ================= ERROR ================= */

    if (!success) {

        if (loadingBubble) {

            loadingBubble.textContent =
                "❌ API Key တွေအားလုံး အလုပ်မလုပ်သေးပါဘူး။\n\n" +
                (
                    lastError?.message ||
                    "Gemini API Error"
                );
        }
    }


    /* ================= CLEAR ATTACHMENT ================= */

    if (success) {

        removeAttachedImage();
    }


    shScrollChatToBottom();
}


/* =========================================================
   NEW CHAT
   ========================================================= */

function startNewChat() {

    shChatHistory = [];

    shResetChatKeyRotation();

    removeAttachedImage();


    const container =
        document.getElementById(
            "chatMessages"
        );

    if (!container) return;


    container.innerHTML = "";


    shAddWelcomeMessage();
}


/* =========================================================
   WELCOME MESSAGE
   ========================================================= */

function shAddWelcomeMessage() {

    const container =
        document.getElementById(
            "chatMessages"
        );

    if (!container) return;


    const row =
        document.createElement("div");

    row.className =
        "sh-message-row ai";


    const avatar =
        document.createElement("div");

    avatar.className =
        "sh-message-avatar";

    avatar.textContent =
        "SH";


    const content =
        document.createElement("div");

    content.className =
        "sh-message-content";


    const name =
        document.createElement("div");

    name.className =
        "sh-message-name";

    name.innerHTML =
        'SH AI <span>AI Assistant</span>';


    const bubble =
        document.createElement("div");

    bubble.className =
        "sh-ai-bubble";

    bubble.innerHTML =
        "မင်္ဂလာပါ 👋<br>" +
        "ကျွန်တော် SH AI ပါ။<br>" +
        "ဘာများကူညီပေးရမလဲ။ 🚀";


    const time =
        document.createElement("div");

    time.className =
        "sh-message-time";

    time.textContent =
        "Just now";


    content.appendChild(
        name
    );

    content.appendChild(
        bubble
    );

    content.appendChild(
        time
    );


    row.appendChild(
        avatar
    );

    row.appendChild(
        content
    );


    container.appendChild(
        row
    );
}


/* =========================================================
   QUICK ACTION
   ========================================================= */

function shQuickPrompt(prompt) {

    const input =
        document.getElementById(
            "chatInput"
        );

    if (!input) return;


    input.value =
        prompt;


    input.focus();
}


/* =========================================================
   CLEAR CHAT
   ========================================================= */

function shClearChat() {

    const container =
        document.getElementById(
            "chatMessages"
        );

    if (!container) return;


    shChatHistory = [];


    container.innerHTML = "";


    shAddWelcomeMessage();
}


/* =========================================================
   CLOSE MENUS WHEN CLICKING OUTSIDE
   ========================================================= */

document.addEventListener(
    "click",
    function(event) {

        const attachMenu =
            document.getElementById(
                "attachMenu"
            );

        const plus =
            document.querySelector(
                ".sh-chat-plus"
            );


        if (
            attachMenu &&
            plus &&
            !attachMenu.contains(event.target) &&
            !plus.contains(event.target)
        ) {

            shCloseAttachMenu();
        }

    }
);


/* =========================================================
   ENTER KEY
   ========================================================= */

document.addEventListener(
    "keydown",
    function(event) {

        const input =
            document.getElementById(
                "chatInput"
            );


        if (
            input &&
            document.activeElement === input &&
            event.key === "Enter" &&
            !event.shiftKey
        ) {

            event.preventDefault();

            sendChatMessage();
        }

    }
);


/* =========================================================
   INITIALIZE
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function() {

        /*
           Make sure welcome message exists
           only when chat area is empty.
        */

        const container =
            document.getElementById(
                "chatMessages"
            );


        if (
            container &&
            container.children.length === 0
        ) {

            shAddWelcomeMessage();
        }

    }
);
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

try {
    if (typeof window.supabase === 'undefined') {
        alert("Error: Supabase CDN script မရောက်သေးပါ (သို့) load လို့မရပါ!");
    } else {
        alert("Supabase Object Loaded Successfully!");
    }
} catch (e) {
    alert("Init Error: " + e.message);
}

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
   8. LOAD PUBLIC ASSETS
   --------------------------------------------------------- */

async function loadSHProAssets(
    searchTerm = ''
) {

    const grid =
        document.getElementById(
            'proAssetGrid'
        );


    if (!grid) {
        return;
    }


    /*
     * Loading state
     */

    grid.innerHTML = `
        <div class="sh-pro-empty-state">
            <div class="sh-pro-empty-icon">
                ⏳
            </div>

            <div class="sh-pro-empty-title">
                ပုံတွေရှာနေပါတယ်
            </div>

            <div class="sh-pro-empty-text">
                ခဏစောင့်ပါ...
            </div>
        </div>
    `;


    try {

        let query =
            shSupabase
                .from(SH_PRO_TABLE)
                .select(
                    'id,title,image_url,category'
                )
                .order(
                    'id',
                    {
                        ascending: false
                    }
                );


        /*
         * Search by category/title.
         */

        if (
            searchTerm &&
            searchTerm.trim()
        ) {

            const keyword =
                searchTerm.trim();


            query =
                query.or(
                    `title.ilike.%${keyword}%,category.ilike.%${keyword}%`
                );
        }


        const {
            data,
            error
        } = await query;


        if (error) {

            console.error(
                'Load assets error:',
                error
            );

            grid.innerHTML = `
                <div class="sh-pro-empty-state">
                    <div class="sh-pro-empty-icon">
                        ⚠️
                    </div>

                    <div class="sh-pro-empty-title">
                        ပုံတွေယူလို့မရပါ
                    </div>

                    <div class="sh-pro-empty-text">
                        ${shSafeText(error.message)}
                    </div>
                </div>
            `;

            return;
        }

         const assets =
            (Array.isArray(data) ? data : [])
                .map((item, index) => ({
                    id: item.id !== undefined && item.id !== null ? item.id : index,
                    ...item
                }));

         SH_PRO_ASSET_CACHE = assets;


        renderSHProAssets(
            assets
        );     
        
    catch (error) {

        console.error(
            'Public asset load error:',
            error
        );

        grid.innerHTML = `
            <div class="sh-pro-empty-state">
                <div class="sh-pro-empty-icon">
                    ⚠️
                </div>

                <div class="sh-pro-empty-title">
                    Connection Error
                </div>

                <div class="sh-pro-empty-text">
                    Internet connection ကို စစ်ပါ။
                </div>
            </div>
        `;
    }
}


/* ---------------------------------------------------------
   9. RENDER ASSET CARDS
   --------------------------------------------------------- */

function renderSHProAssets(
    assets
) {

    const grid =
        document.getElementById(
            'proAssetGrid'
        );


    if (!grid) {
        return;
    }


    if (!assets.length) {

        grid.innerHTML = `
            <div class="sh-pro-empty-state">
                <div class="sh-pro-empty-icon">
                    🔍
                </div>

                <div class="sh-pro-empty-title">
                    ပုံမတွေ့ပါ
                </div>

                <div class="sh-pro-empty-text">
                    ရှာဖွေတဲ့ Category နဲ့ ကိုက်ညီတဲ့ပုံ မရှိသေးပါ။
                </div>
            </div>
        `;

        return;
    }


    /*
     * Limit display to 60.
     */

    const visibleAssets =
        assets.slice(0, 60);


    grid.innerHTML =
        visibleAssets
            .map(asset =>
                createSHProAssetCard(
                    asset
                )
            )
            .join('');
}


/* ---------------------------------------------------------
   10. CREATE CARD
   --------------------------------------------------------- */

 function createSHProAssetCard(asset) {
    const id = asset.id;

    const imageUrl =
        shSafeText(
            asset.image_url
        );

    const category =
        shSafeText(
            asset.category ||
            'Uncategorized'
        );

    const title =
        shSafeText(
            asset.title ||
            'SH Asset'
        );

    return `
        <div
            class="sh-pro-asset-card"
            data-asset-id="${id}"
        >

            <div
                class="sh-pro-image-wrap"
                onclick="openSHProImagePreview('${id}')"
            >

                <img
                    src="${imageUrl}"
                    alt="${title}"
                    loading="lazy"
                    onerror="this.style.opacity='0.25'"
                >

                <div class="sh-pro-image-overlay">
                    <i class="fa-solid fa-expand"></i>
                </div>

            </div>


            <div class="sh-pro-asset-info">

                <div
                    class="sh-pro-asset-category"
                >
                    ${category}
                </div>


                <div
                    class="sh-pro-asset-name"
                >
                    ${title}
                </div>


                <div
                    class="sh-pro-card-actions"
                >

                    <button
                        class="sh-pro-download"
                        onclick="event.stopPropagation(); downloadSHProAsset('${id}')"
                    >
                        <i class="fa-solid fa-download"></i>
                        Download
                    </button>


                    <button
                        class="sh-pro-delete"
                        onclick="event.stopPropagation(); deleteSHProAsset('${id}')"
                        title="Delete"
                    >
                        <i class="fa-solid fa-trash"></i>
                    </button>

                </div>

            </div>

        </div>
    `;
}

/* ---------------------------------------------------------
   11. KEEP CURRENT ASSETS IN MEMORY
   --------------------------------------------------------- */

let SH_PRO_ASSET_CACHE = [];


/*
 * Override render so preview/download can find asset.
 */

const shOriginalRenderSHProAssets =
    renderSHProAssets;


/* ---------------------------------------------------------
   12. REDEFINE LOAD WITH CACHE
   --------------------------------------------------------- */

async function loadSHProAssetsWithCache(
    searchTerm = ''
) {

    try {

        let query =
            shSupabase
                .from(SH_PRO_TABLE)
                .select(
                    'id,title,image_url,category'
                )
                .order(
                    'id',
                    {
                        ascending: false
                    }
                );


        if (
            searchTerm &&
            searchTerm.trim()
        ) {

            const keyword =
                searchTerm.trim();


            query =
                query.or(
                    `title.ilike.%${keyword}%,category.ilike.%${keyword}%`
                );
        }


        const {
            data,
            error
        } = await query;


        if (error) {
            throw error;
        }


        SH_PRO_ASSET_CACHE =
            Array.isArray(data)
                ? data
                : [];


        renderSHProAssets(
            SH_PRO_ASSET_CACHE
        );

    }
    catch (error) {

        console.error(
            error
        );

        const grid =
            document.getElementById(
                'proAssetGrid'
            );

        if (grid) {

            grid.innerHTML = `
                <div class="sh-pro-empty-state">
                    <div class="sh-pro-empty-icon">
                        ⚠️
                    </div>

                    <div class="sh-pro-empty-title">
                        မရပါ
                    </div>

                    <div class="sh-pro-empty-text">
                        ${shSafeText(error.message)}
                    </div>
                </div>
            `;
        }
    }
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
   14. PREVIEW
   --------------------------------------------------------- */

function openSHProImagePreview(
    id
) {

    const asset =
        getSHProAssetById(id);


    if (!asset) {

        shShowProMessage(
            'ပုံကို ရှာမတွေ့ပါ။'
        );

        return;
    }


    const oldPreview =
        document.getElementById(
            'shProImagePreview'
        );


    if (oldPreview) {
        oldPreview.remove();
    }


    const preview =
        document.createElement('div');

    preview.id =
        'shProImagePreview';


    preview.innerHTML = `

        <div
            class="sh-pro-preview-backdrop"
            onclick="closeSHProImagePreview(event)"
        >

            <div
                class="sh-pro-preview-box"
                onclick="event.stopPropagation()"
            >

                <button
                    class="sh-pro-preview-close"
                    onclick="closeSHProImagePreview()"
                >
                    <i class="fa-solid fa-xmark"></i>
                </button>


                <img
                    class="sh-pro-preview-image"
                    src="${shSafeText(asset.image_url)}"
                    alt="${shSafeText(asset.title || 'SH Asset')}"
                >


                <div class="sh-pro-preview-info">

                    <div class="sh-pro-preview-category">
                        ${shSafeText(asset.category || '')}
                    </div>

                    <div class="sh-pro-preview-title">
                        ${shSafeText(asset.title || 'SH Asset')}
                    </div>

                </div>


                <button
                    class="sh-pro-preview-download"
                    onclick="downloadSHProAsset(${Number(asset.id)})"
                >
                    <i class="fa-solid fa-download"></i>
                    Download
                </button>

            </div>

        </div>
    `;


    document.body.appendChild(
        preview
    );
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

function addSpeechBlock(initialText = "", selectedSpeaker = "Charon") {
    blockCounter++;
    const container = document.getElementById("speechBlocksContainer");

    const blockDiv = document.createElement("div");
    blockDiv.className = "speech-block-card";
    blockDiv.id = `speechBlock_${blockCounter}`;
    blockDiv.setAttribute("data-speaker", selectedSpeaker);

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
        <div class="block-card-header">
            <span class="block-card-title">💬 <span class="block-number-text">Speech Block (1)</span></span>
        </div>
        <div class="block-card-body">
            <div class="mic-avatar-circle">🎙️</div>
            <div style="flex:1; width:100%;">
                <label style="display:block; font-size:12px; color:#8eb0cb; margin-bottom:6px;">Speaker Voice ရွေးရန်:</label>
                <div class="speaker-select-trigger" onclick="openVoicePicker(${blockCounter})">
                    <span class="block-speaker-label">${speakerLabelMap[selectedSpeaker] || selectedSpeaker}</span>
                    <span>▼</span>
                </div>
            </div>
        </div>
        <textarea class="block-textarea block-text-input" placeholder="ဒီ block အတွက် ပြောရမည့် စာသား ရိုက်ထည့်ပါ...">${initialText}</textarea>
        
        <div class="block-card-footer">
            <div class="card-controls-left">
                <button class="btn-card-ctrl" onclick="moveBlockUp(${blockCounter})">↑ Move Up</button>
                <button class="btn-card-ctrl" onclick="moveBlockDown(${blockCounter})">↓ Move Down</button>
            </div>
            <button class="btn-card-delete" onclick="removeSpeechBlock(${blockCounter})">Delete</button>
        </div>
    `;

    container.appendChild(blockDiv);
    reindexBlocks();
}

function removeSpeechBlock(id) {
    const block = document.getElementById(`speechBlock_${id}`);
    if (block) {
        block.remove();
        reindexBlocks();
    }
}

function moveBlockUp(id) {
    const block = document.getElementById(`speechBlock_${id}`);
    if (block && block.previousElementSibling) {
        block.parentNode.insertBefore(block, block.previousElementSibling);
        reindexBlocks();
    }
}

function moveBlockDown(id) {
    const block = document.getElementById(`speechBlock_${id}`);
    if (block && block.nextElementSibling) {
        block.parentNode.insertBefore(block.nextElementSibling, block);
        reindexBlocks();
    }
}

function reindexBlocks() {
    const blocks = document.querySelectorAll(".speech-block-card");
    blocks.forEach((el, index) => {
        const numText = el.querySelector(".block-number-text");
        if(numText) numText.textContent = `Speech Block (${index + 1})`;
    });

    const addBtn = document.getElementById("addBlockBtn");
    if(addBtn) {
        addBtn.textContent = `+ Add Speech Block (${blocks.length + 1})`;
    }
}

// Initialize default block
window.addEventListener("DOMContentLoaded", () => {
    addSpeechBlock();
});

function updateSpeed(val){
    document.getElementById("speedVal").textContent = val + "x";
    const player = document.getElementById("audioPlayer");
    if(player){
        player.playbackRate = parseFloat(val);
    }
}

function updateSingleSpeed(val){
    document.getElementById("singleSpeedVal").textContent = val + "x";
    const player = document.getElementById("singleAudioPlayer");
    if(player){
        player.playbackRate = parseFloat(val);
    }
}

function getStoredKey(){
    return localStorage.getItem("gemini_api_key") || "";
}

function updateKeyStatus(){
    const key = document.getElementById("apiKey").value.trim();
    const status = document.getElementById("keyStatus");

    if(key){
        status.textContent = "Ready";
        status.classList.add("ok");
    }else{
        status.textContent = "Missing";
        status.classList.remove("ok");
    }
}

function saveKey(){
    const key = document.getElementById("apiKey").value.trim();
    if(!key){
        showKeyMessage("API Key မထည့်ရသေးပါ။", "error");
        return;
    }

    if(document.getElementById("saveKey").checked){
        localStorage.setItem("gemini_api_key", key);
    }

    updateKeyStatus();
    showKeyMessage("✅ API Key ကို သိမ်းပြီးပါပြီ။", "success");
}

function changeKey(){
    const input = document.getElementById("apiKey");
    input.focus();
    input.select();
}

function removeKey(){
    localStorage.removeItem("gemini_api_key");
    document.getElementById("apiKey").value = "";
    updateKeyStatus();
    showKeyMessage("API Key ကို ဖျက်ပြီးပါပြီ။", "success");
}

function toggleKey(){
    const input = document.getElementById("apiKey");
    input.type = input.type === "password" ? "text" : "password";
}

function showKeyMessage(text,type){
    const box = document.getElementById("keyMessage");
    box.textContent = text;
    box.className = "message " + type;
}

async function testKey(){
    const rawKeys = document.getElementById("apiKey").value.trim();
    if(!rawKeys){
        showKeyMessage("အရင်ဆုံး API Key ထည့်ပါ။", "error");
        return;
    }

    const keysList = rawKeys.split(",").map(k => k.trim()).filter(k => k.length > 0);
    showKeyMessage("🔄 API Key ကို စစ်ဆေးနေပါတယ်...", "info");

    try{
        const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models", {
            method:"GET",
            headers: { "x-goog-api-key": keysList[0] }
        });

        const data = await response.json().catch(()=>({}));
        if(!response.ok){
            throw new Error(data?.error?.message || `HTTP ${response.status}`);
        }

        if(document.getElementById("saveKey").checked){
            localStorage.setItem("gemini_api_key", rawKeys);
        }

        updateKeyStatus();
        showKeyMessage("✅ API Key အလုပ်လုပ်ပါတယ်။", "success");

    }catch(error){
        showKeyMessage("❌ API Key Error: " + error.message, "error");
    }
}
async function testApiKey() {
    const apiKey = document.getElementById('apiKey').value.trim();
    if (!apiKey) {
        alert('ကျေးဇူးပြု၍ API Key အရင်ထည့်ပါ။');
        return;
    }
    
    alert('စစ်ဆေးနေပါပြီ... ခဏစောင့်ပါ။');
    
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: "hi" }] }] })
        });
        
        if (response.ok) {
            alert('✅ API Key အလုပ်လုပ်ပါသည် (Valid Key)');
        } else {
            alert('❌ API Key မမှန်ပါ သို့မဟုတ် သက်တမ်းကုန်နေပါပြီ။');
        }
    } catch (error) {
        alert('⚠️ ချိတ်ဆက်မှု အမှားအယွင်းရှိပါသည်: ' + error.message);
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

        button.textContent = '⏸ Stop';

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
