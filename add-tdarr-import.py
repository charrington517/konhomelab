from pathlib import Path

path = Path("frontend/src/App.jsx")
text = path.read_text()

# Add import at top
if "import TdarrPanel" not in text:
    text = text.replace(
        "import axios from \"axios\";",
        "import axios from \"axios\";\nimport TdarrPanel from \"./components/TdarrPanel\";"
    )

# Add component before Object.entries(groups)
if "<TdarrPanel />" not in text:
    text = text.replace(
        "        {Object.entries(groups).map(",
        "        <TdarrPanel />\n\n        {Object.entries(groups).map("
    )

path.write_text(text)
print("TdarrPanel import and component added.")
