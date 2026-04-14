# ============================================================
#  Flask Backend - Banker's Algorithm Bridge
#
#  This file acts as a bridge between the HTML frontend
#  and the compiled C program.
#
#  Flow: HTML → JS (fetch) → Flask → C binary → Flask → JS → HTML
#
#  Run with:  python app.py
#  Server starts at: http://localhost:5000
# ============================================================

from flask import Flask, request, jsonify, send_from_directory
import subprocess
import os
import json

app = Flask(__name__, static_folder="static")

# Path to the compiled C binary (same folder as this script)
C_BINARY = os.path.join(os.path.dirname(__file__), "bankers")
# On Windows, use: C_BINARY = "bankers.exe"


# ── Serve the frontend HTML ──────────────────────────────────
@app.route("/")
def index():
    return app.send_static_file("index.html")


# ── Main API endpoint ─────────────────────────────────────────
@app.route("/run-bankers", methods=["POST"])
def run_bankers():
    """
    Accepts JSON from the frontend, builds the input string
    for the C program, runs it via subprocess, parses the
    output, and returns structured JSON to the frontend.

    Expected JSON body:
    {
        "num_processes": 3,
        "num_resources": 3,
        "allocation": [[0,1,0],[2,0,0],[3,0,2]],
        "max":        [[7,5,3],[3,2,2],[9,0,2]],
        "available":  [3,3,2]
    }
    """
    try:
        data = request.get_json(force=True)
        if not data:
            return jsonify({"error": "No JSON data received"}), 400

        # ── Extract & validate fields ──────────────────────────
        num_p = int(data["num_processes"])
        num_r = int(data["num_resources"])
        allocation = data["allocation"]   # list of lists
        max_mat    = data["max"]          # list of lists
        available  = data["available"]   # list

        # Basic server-side validation
        if not (1 <= num_p <= 20 and 1 <= num_r <= 20):
            return jsonify({"error": "Processes: 1-20, Resources: 1-20"}), 400

        if len(allocation) != num_p or len(max_mat) != num_p:
            return jsonify({"error": "Matrix row count mismatch"}), 400

        if len(available) != num_r:
            return jsonify({"error": "Available vector length mismatch"}), 400

        # ── Build the input string for the C program ───────────
        # Format: first line = "P R", then allocation rows,
        #         then max rows, then available row.
        lines = [f"{num_p} {num_r}"]

        for row in allocation:
            if len(row) != num_r:
                return jsonify({"error": "Allocation matrix column mismatch"}), 400
            lines.append(" ".join(str(v) for v in row))

        for row in max_mat:
            if len(row) != num_r:
                return jsonify({"error": "Max matrix column mismatch"}), 400
            lines.append(" ".join(str(v) for v in row))

        lines.append(" ".join(str(v) for v in available))
        input_str = "\n".join(lines) + "\n"

        # ── Check binary exists ───────────────────────────────
        if not os.path.isfile(C_BINARY):
            return jsonify({
                "error": (
                    "C binary not found. "
                    "Please compile first: gcc bankers.c -o bankers"
                )
            }), 500

        # ── Run the C program ─────────────────────────────────
        result = subprocess.run(
            [C_BINARY],
            input=input_str,
            capture_output=True,
            text=True,
            timeout=10          # kill if it hangs
        )

        stdout = result.stdout.strip()
        stderr = result.stderr.strip()

        if result.returncode != 0 or stdout.startswith("ERROR"):
            # C program printed an ERROR line
            error_msg = stdout if stdout.startswith("ERROR") else stderr
            return jsonify({"error": error_msg or "C program failed"}), 400

        # ── Parse C program output ────────────────────────────
        parsed = parse_c_output(stdout, num_p, num_r, allocation, max_mat, available)
        return jsonify(parsed)

    except subprocess.TimeoutExpired:
        return jsonify({"error": "C program timed out (> 10 seconds)"}), 500
    except KeyError as e:
        return jsonify({"error": f"Missing field in request: {e}"}), 400
    except ValueError as e:
        return jsonify({"error": f"Invalid value: {e}"}), 400
    except Exception as e:
        return jsonify({"error": f"Server error: {str(e)}"}), 500


def parse_c_output(stdout, num_p, num_r, allocation, max_mat, available):
    """
    Parse the structured output from the C program and return
    a clean dictionary that the frontend can consume directly.

    C output sections (in order):
      NEED_MATRIX
      <P rows of R numbers>
      STEPS
      <count>
      <count lines>
      RESULT SAFE  or  RESULT UNSAFE
      SEQUENCE P0 P1 ...  (only if SAFE)
    """
    lines = stdout.splitlines()
    idx   = 0

    need_matrix = []
    steps       = []
    is_safe     = False
    sequence    = []

    # Parse NEED_MATRIX section
    if idx < len(lines) and lines[idx] == "NEED_MATRIX":
        idx += 1
        for _ in range(num_p):
            if idx < len(lines):
                row = list(map(int, lines[idx].split()))
                need_matrix.append(row)
                idx += 1

    # Parse STEPS section
    if idx < len(lines) and lines[idx] == "STEPS":
        idx += 1
        if idx < len(lines):
            step_count = int(lines[idx])
            idx += 1
            for _ in range(step_count):
                if idx < len(lines):
                    steps.append(lines[idx])
                    idx += 1

    # Parse RESULT
    if idx < len(lines):
        result_line = lines[idx]
        idx += 1
        if "SAFE" in result_line and "UNSAFE" not in result_line:
            is_safe = True
            # Next line: SEQUENCE P0 P1 ...
            if idx < len(lines) and lines[idx].startswith("SEQUENCE"):
                parts = lines[idx].split()
                sequence = parts[1:]   # ["P0", "P1", ...]

    return {
        "safe":        is_safe,
        "need_matrix": need_matrix,
        "sequence":    sequence,
        "steps":       steps,
        "num_p":       num_p,
        "num_r":       num_r,
        "allocation":  allocation,
        "max":         max_mat,
        "available":   available,
    }


# ── Run server ───────────────────────────────────────────────
if __name__ == "__main__":
    print("=" * 55)
    print("  Banker's Algorithm Server")
    print("  Open: http://localhost:5000")
    print("=" * 55)
    app.run(debug=True, host="127.0.0.1", port=5000)
