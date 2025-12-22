# list_gemini_models.py  (improved)
import os, json

def pretty_print(obj):
    try:
        print(json.dumps(obj, default=str, indent=2)[:4000])
    except Exception:
        print(repr(obj))

def try_genai_client(api_key):
    try:
        from google import genai
    except Exception as e:
        print("import google.genai failed:", e)
        return False

    try:
        client = genai.Client(api_key=api_key)
    except Exception as e:
        print("creating genai.Client failed:", e)
        return False

    try:
        pager = client.models.list()
    except Exception as e:
        print("client.models.list() failed:", e)
        return False

    print("Listing models (first 200):")
    count = 0
    for m in pager:
        count += 1
        # model may be proto object or dict-like
        try:
            mid = getattr(m, "name", None) or getattr(m, "id", None) or (m.get("name") if isinstance(m, dict) else None)
        except Exception:
            mid = None
        print(f"[{count}] model: {mid or repr(m)[:80]}")
        # print some attributes if present
        try:
            # attrs can vary by SDK; inspect common fields
            attrs = {}
            if hasattr(m, "display_name"):
                attrs["display_name"] = m.display_name
            if hasattr(m, "release_notes"):
                attrs["release_notes"] = m.release_notes
            # some objects contain supported_methods or capabilities
            if hasattr(m, "supported_methods"):
                attrs["supported_methods"] = m.supported_methods
            # attempt dict-like access
            if isinstance(m, dict):
                attrs.update({k: v for k, v in m.items() if k in ("supported_methods", "display_name", "capabilities", "features")})
            if attrs:
                pretty_print(attrs)
        except Exception:
            pass
        if count >= 200:
            break
    print("Total listed:", count)
    return True

def main():
    key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY") or os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
    if not key:
        print("No GEMINI_API_KEY / GOOGLE_API_KEY / GOOGLE_APPLICATION_CREDENTIALS found in env.")
        return
    ok = try_genai_client(key)
    if not ok:
        print("genai client model listing failed. Check sdk install/version and credentials.")

if __name__ == "__main__":
    main()
