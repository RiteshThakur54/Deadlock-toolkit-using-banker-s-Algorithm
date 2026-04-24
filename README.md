# Banker's Algorithm — Deadlock Prevention
### OS Project | C + Python Flask + HTML/CSS/JS

--- 

## 📁 Folder Structure

```
bankers_project/
│
├── bankers.c           ← Core Banker's Algorithm in C
├── bankers             ← Compiled binary (you create this)
├── app.py              ← Python Flask backend server
│
└── static/
    ├── index.html      ← Frontend GUI
    ├── style.css       ← Styling
    └── script.js       ← Frontend logic (fetch API)
```

---

## 🔄 Architecture

```
HTML (index.html)
  → JavaScript (script.js)  [fetch POST /run-bankers]
    → Python Flask (app.py) [subprocess]
      → C Binary (bankers)  [stdin/stdout]
    ← Flask parses output, returns JSON
  ← JS renders result in UI
```

---

## 🛠️ Setup & Run (Step by Step)

### Step 1 — Compile the C program

**Linux / macOS:**
```bash
gcc bankers.c -o bankers
```

**Windows (MinGW/MSYS2):**
```bash
gcc bankers.c -o bankers.exe
```
> On Windows, also edit `app.py` line ~18 and change `"bankers"` to `"bankers.exe"`

---

### Step 2 — Install Python dependencies

```bash
pip install flask
```

---

### Step 3 — Start the Flask server

```bash
python app.py
```

You should see:
```
=======================================================
  Banker's Algorithm Server
  Open: http://localhost:5000
=======================================================
```

---

### Step 4 — Open the browser

Go to: **http://localhost:5000**

---

## 🧪 Testing the C Program Directly

You can test the C program independently (without Flask):

```bash
echo "5 3
0 1 0
2 0 0
3 0 2
2 1 1
0 0 2
7 5 3
3 2 2
9 0 2
2 2 2
4 3 3
3 3 2" | ./bankers
```

Expected output:
```
NEED_MATRIX
7 4 3
1 2 2
6 0 0
0 1 1
4 3 1
STEPS
6
INIT Work = [3 3 2]
STEP P1 allocated | Work = [5 3 2] | Need was [1 2 2]
...
RESULT SAFE
SEQUENCE P1 P3 P4 P0 P2
```

---

## ✅ How the Algorithm Works

1. **Need Matrix** = Max − Allocation  
   *(how much more each process may request)*

2. **Safety Algorithm:**
   - Start with `Work = Available`
   - Find a process `Pi` where `Need[i] ≤ Work`
   - Simulate its completion: `Work += Allocation[i]`
   - Repeat until all processes finish → **SAFE**
   - If stuck before all finish → **UNSAFE**

---

## 📌 Input Validation

- Allocation must not exceed Max (checked in both JS and C)
- All values must be non-negative integers
- Process count: 1–20, Resource count: 1–20
- Frontend shows errors before even calling the server

---

## 🎯 Quick Test Examples

The UI has two built-in examples:
- **Classic Example** — 5 processes, 3 resources → SAFE
- **Unsafe Example**  — 3 processes, 3 resources → UNSAFE (no available resources)
