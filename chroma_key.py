import os
from PIL import Image

def process_image(filepath):
    try:
        img = Image.open(filepath)
        img = img.convert("RGBA")
        datas = img.getdata()
        
        new_data = []
        changed = 0
        for item in datas:
            r, g, b, a = item
            # Chroma key green check: g is dominant over r and b
            # Usually green screens have g > 1.2 * r and g > 1.2 * b and g > 60
            # To be safe, we check if g is significantly larger than both r and b
            if g > 70 and g > r * 1.2 and g > b * 1.2:
                # Replace with transparent pixel
                new_data.append((0, 0, 0, 0))
                changed += 1
            else:
                new_data.append(item)
                
        if changed > 0:
            img.putdata(new_data)
            img.save(filepath, "PNG")
            print(f"Processed {os.path.basename(filepath)}: Keyed {changed} green pixels.")
        else:
            print(f"Skipped {os.path.basename(filepath)}: No green screen detected.")
            
    except Exception as e:
        print(f"Error processing {filepath}: {e}")

def main():
    base_dir = r"D:\codex\paper_demon_hunter\assets"
    exclude_dir = "ground"
    
    print("--- Starting Chroma Key Green Screen Removal ---")
    for root, dirs, files in os.walk(base_dir):
        if exclude_dir in root:
            continue
            
        for file in files:
            if file.lower().endswith(".png"):
                filepath = os.path.join(root, file)
                process_image(filepath)
                
    print("--- Chroma Key Processing Completed! ---")

if __name__ == "__main__":
    main()
