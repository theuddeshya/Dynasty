
import json
import re

def parse_raw_data(raw_data):
    families = []
    current_family = None
    
    # Split the raw data into lines and filter out empty lines
    lines = [line.strip() for line in raw_data.split("\n") if line.strip()]
    
    for line in lines:
        if line.startswith("###"):
            # New family section
            if current_family:
                families.append(current_family)
            family_name = line.replace("###", "").strip()
            current_family = {"family_name": family_name, "members": []}
        elif line.startswith("**") and current_family:
            # Member details
            # Extract name, profession, and bio using regex for better robustness
            match = re.match(r"\*\*(.*?):\*\*\s*(.*)", line)
            if match:
                name = match.group(1).strip()
                full_description = match.group(2).strip()

                profession = ""
                bio = ""
                connections = []

                # Attempt to extract profession (usually the first part before a major separator or relationship)
                # Common professions are usually single words or short phrases at the beginning
                # Let's assume the first sentence or phrase before a relationship is the profession
                
                # Regex to find common relationship patterns
                relationship_patterns = [
                    r"Married to (.*?)(?: \(.*?\))?",
                    r"Son of (.*?)(?: \(.*?\))?",
                    r"Daughter of (.*?)(?: \(.*?\))?",
                    r"Brother of (.*?)(?: \(.*?\))?",
                    r"Sister of (.*?)(?: \(.*?\))?",
                    r"Wife of (.*?)(?: \(.*?\))?",
                    r"Husband of (.*?)(?: \(.*?\))?",
                    r"Mother of (.*?)(?: \(.*?\))?",
                    r"Father of (.*?)(?: \(.*?\))?",
                    r"Niece of (.*?)(?: \(.*?\))?",
                    r"Nephew of (.*?)(?: \(.*?\))?",
                    r"Cousin of (.*?)(?: \(.*?\))?",
                    r"Ex-wife of (.*?)(?: \(.*?\))?",
                    r"Ex-husband of (.*?)(?: \(.*?\))?",
                    r"Partner of (.*?)(?: \(.*?\))?",
                    r"Grandson of (.*?)(?: \(.*?\))?",
                    r"Granddaughter of (.*?)(?: \(.*?\))?",
                    r"Aunt of (.*?)(?: \(.*?\))?",
                    r"Uncle of (.*?)(?: \(.*?\))?",
                    r"Member of (.*?)(?: family)?",
                    r"Founder of (.*?)(?: \(.*?\))?",
                    r"Director", r"Producer", r"Actor", r"Actress", r"Singer", r"Writer", r"Politician", r"Dancer", r"Choreographer", r"Businessman", r"Businesswoman", r"Interior designer", r"Lyricist", r"Poet", r"Cinematographer", r"Entrepreneur", r"Model", r"Action choreographer", r"Hotelier"
                ]

                # Extract professions first
                profession_match = re.match(r"(.*?)(?:\.|Married to|Son of|Daughter of|Brother of|Sister of|Wife of|Husband of|Mother of|Father of|Niece of|Nephew of|Cousin of|Ex-wife of|Ex-husband of|Partner of|Grandson of|Granddaughter of|Aunt of|Uncle of|Member of|Founder of|Director|Producer|Actor|Actress|Singer|Writer|Politician|Dancer|Choreographer|Businessman|Businesswoman|Interior designer|Lyricist|Poet|Cinematographer|Entrepreneur|Model|Action choreographer|Hotelier)", full_description)
                if profession_match:
                    profession = profession_match.group(1).strip().replace(".", "")
                    remaining_description = full_description[len(profession_match.group(1)):].strip()
                else:
                    remaining_description = full_description

                # Extract connections and clean up bio
                temp_bio = remaining_description
                for pattern in relationship_patterns:
                    for conn_match in re.finditer(pattern, temp_bio):
                        connections.append(conn_match.group(0).strip())
                        temp_bio = temp_bio.replace(conn_match.group(0), "").strip()
                
                bio = re.sub(r"\s*\.\s*", ". ", temp_bio).strip()
                bio = re.sub(r"\s*\(\s*\)", "", bio).strip()
                bio = re.sub(r"\s*,", ",", bio).strip()
                bio = re.sub(r"\s*\.", ".", bio).strip()
                bio = bio.replace("(", "").replace(")", "").strip()
                bio = re.sub(r'\s*\(.*?\)', '', bio) # Remove anything in parentheses that might be left
                bio = re.sub(r'\s*\.\s*$', '', bio) # Remove trailing dot if any
                bio = bio.strip()

                member = {
                    "name": name,
                    "profession": profession,
                    "bio": bio,
                    "connections": connections
                }
                current_family["members"].append(member)
            else:
                print(f"Warning: Could not parse member line: {line}")

    if current_family:
        families.append(current_family)

    return families

if __name__ == "__main__":
    try:
        with open("bollywood_families_raw_data.txt", "r") as f:
            raw_data = f.read()
        
        structured_data = parse_raw_data(raw_data)
        
        with open("data.json", "w") as f:
            json.dump(structured_data, f, indent=4)
        print("data.json created successfully.")
    except Exception as e:
        print(f"An error occurred: {e}")


