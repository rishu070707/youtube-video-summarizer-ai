
"""Transcription helper (stub).
Replace this stub with calls to whisperx or OpenAI's Whisper. This file shows expected input / output shapes.
"""
def transcribe(audio_path, model='small'):
    # Return list of segments: [{start, end, text, confidence}, ...]
    print('Stub transcribe called for', audio_path)
    return [{'start':0.0,'end':10.0,'text':'This is a transcribed sentence.','confidence':0.96}]
