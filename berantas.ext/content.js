// ===============================
// LOAD MODEL + VOCABULARY
// ===============================

async function loadJSON(path) {
    return fetch(chrome.runtime.getURL(path))
        .then(r => r.json());
}

// ===============================
// CLEANSING
// ===============================

function cleansing(text) {

    return text
        .toLowerCase()
        .replace(/\d+/g, "")          // remove numbers
        .replace(/[^\w\s]/g, " ")     // remove symbols
        .replace(/\s+/g, " ")         // remove extra spaces
        .trim();
}

// ===============================
// TOKENIZATION
// ===============================

function tokenize(text) {
    return text.split(/\s+/).filter(Boolean);
}

// ===============================
// STOPWORDS
// ===============================

const indo_stopwords = new Set([
    "ada","adalah","agak","agar","akan","amat","anda",
    "antara","anu","apakah","apalagi","atau",
    "bagaimanapun","bagi","bahwa","begitu","belum",
    "bisa","boleh","dahulu","dalam","dan","dapat",
    "dari","daripada","demi","demikian","dengan",
    "di","dia","dimana","dll","dsb","dst","dua",
    "dulunya","guna","hal","hanya","harus","ia",
    "ingin","ini","itu","itulah","jika","juga",
    "kah","kami","karena","ke","kecuali","kemana",
    "kembali","kenapa","kepada","ketika","kita",
    "lagi","lain","maka","mari","masih","melainkan",
    "mengapa","menurut","mereka","namun","nanti",
    "nggak","oh","ok","oleh","pada","para","pasti",
    "pula","pun","saat","saja","sambil","sampai",
    "saya","sebab","sebagai","sebelum","sebetulnya",
    "secara","sedangkan","seharusnya","sehingga",
    "sekitar","selagi","selain","sementara","seolah",
    "seperti","seraya","serta","sesuatu","sesudah",
    "setelah","seterusnya","setiap","setidaknya",
    "sudah","supaya","tanpa","tapi","telah",
    "tentang","tentu","terhadap","tetapi","tidak",
    "toh","tolong","untuk","walau","ya","yaitu",
    "yakni","yang"
]);

const eng_stopwords = new Set([
    "a","about","above","after","again","against",
    "all","am","an","and","any","are","as","at",
    "be","because","been","before","being","below",
    "between","both","but","by","can","did","do",
    "does","doing","down","during","each","few",
    "for","from","further","had","has","have",
    "having","he","her","here","hers","herself",
    "him","himself","his","how","i","if","in",
    "into","is","it","its","itself","just","me",
    "more","most","my","myself","no","nor","not",
    "now","of","off","on","once","only","or",
    "other","our","ours","ourselves","out","over",
    "own","same","she","should","so","some","such",
    "than","that","the","their","theirs","them",
    "themselves","then","there","these","they",
    "this","those","through","to","too","under",
    "until","up","very","was","we","were","what",
    "when","where","which","while","who","whom",
    "why","will","with","you","your","yours",
    "yourself","yourselves"
]);

const all_stopwords = new Set([
    ...indo_stopwords,
    ...eng_stopwords
]);

// ===============================
// REMOVE STOPWORDS
// ===============================

function removeStopwords(tokens) {

    return tokens.filter(
        word => !all_stopwords.has(word)
    );
}

// ===============================
// BOW VECTORIZATION
// ===============================

function vectorize(tokens, vocabulary) {

    const vector = new Array(
        Object.keys(vocabulary).length
    ).fill(0);

    for (const token of tokens) {

        if (token in vocabulary) {

            const idx = vocabulary[token];

            vector[idx] += 1;
        }
    }

    return vector;
}

// ===============================
// LOGISTIC REGRESSION
// ===============================

function sigmoid(x) {
    return 1 / (1 + Math.exp(-x));
}

function predict(vector, model) {

    let score = model.bias;

    for (let i = 0; i < vector.length; i++) {

        score += vector[i] * model.weights[i];
    }

    return sigmoid(score);
}

// ===============================
// MAIN PIPELINE
// ===============================

async function classifyPage() {

    // LOAD
    const vocabulary = await loadJSON("vocabulary.json");

    const model = await loadJSON("model.json");
    
    const whitelist = await loadJSON("whitelist.json");


    // CURRENT DOMAIN
    const currentDomain =
        window.location.hostname;

    const normalizedDomain =
        currentDomain.replace(/^www\./, "");

    // WHITELIST CHECK
    if (
        // whitelist.includes(normalizedDomain)
        whitelist.some(domain =>
           normalizedDomain.endsWith(domain)
        )
    ) {

        console.log(
            "Whitelisted:",
            normalizedDomain
        );

        // alert(
        //     "SAFE WEBSITE\n\n" +
        //     "WHITELISTED"
        // );

        return;
    }

    // EXTRACT PAGE TEXT
    const rawText = document.body.innerText;

    // PREPROCESSING
    let cleaned = cleansing(rawText);

    let tokens = tokenize(cleaned);

    tokens = removeStopwords(tokens);

    // VECTORIZE
    const vector = vectorize(tokens, vocabulary);

    // PREDICT
    const probability = predict(vector, model);

    console.log("Prediction probability:", probability);

    // REDIRECT IF POSITIVE
    // if (probability > 0.8) {

    //     window.location.href =
    //         "https://anastasiahrtn.github.io/berantas-judol/page/landing.html";
    // }
    // else {alert("SAFE WEBSITE");
    // }

    if (probability > 0.8) {
        // alert(
        //     "GAMBLING WEBSITE DETECTED\n\n" +
        //     "Probability: " + probability.toFixed(4)
        // );

        window.location.href =
            "https://anastasiahrtn.github.io/berantas-judol/page/landing.html";

    } else {

        // alert(
        //     "SAFE WEBSITE\n\n" +
        //     "Probability: " + probability.toFixed(4)
        // );
    }
}

// ===============================
// RUN ON PAGE LOAD
// ===============================

window.addEventListener("load", () => {

    classifyPage();

});