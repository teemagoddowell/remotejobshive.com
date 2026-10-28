import os
import json
import time
import re
import warnings
from curl_cffi import requests
import google.generativeai as genai
from dotenv import load_dotenv
from slugify import slugify

warnings.filterwarnings("ignore", category=FutureWarning, module="google.auth")

load_dotenv()

# --- Configurations ---
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
genai.configure(api_key=GEMINI_API_KEY)

HIVER_API_KEY = os.getenv("SCRAPER_API_KEY")
HIVER_ENDPOINT = os.getenv("HIVER_ENDPOINT", "https://api.remotejobshive.com/hiver/add-job")

ROCKETSHIP_API_KEY = os.getenv("REMOTE_ROCKETSHIP_API_KEY", "").strip()
ROCKETSHIP_ENDPOINT = "https://www.remoterocketship.com/api/openclaw/jobs/"

DATA_DIR = os.getenv("DATA_DIR", "./data")
os.makedirs(DATA_DIR, exist_ok=True)
SEEN_FILE = os.path.join(DATA_DIR, "seen.json")
FAILED_FILE = os.path.join(DATA_DIR, "failed.json")
TRACKER_FILE = os.path.join(DATA_DIR, "tracker.json")

CDN_LOGOS_DIR = os.getenv("CDN_LOGOS_DIR", "./logos")
CDN_PUBLIC_BASE_URL = os.getenv("CDN_PUBLIC_BASE_URL", "https://cdn.remotejobshive.com/logos")

blacklisted_companies = ['concentrix']

# --- Reference Mappings ---
locations = {
    1: "Anywhere in the World – Remote",
    2: "United States – Remote",
    3: "Europe – Remote",
    4: "North America – Remote",
    5: "Latin America – Remote",
    6: "Asia – Remote",
    7: "Africa – Remote",
    8: "Oceania – Remote",
    9: "Middle East – Remote",
    10: "United Kingdom – Remote",
    11: "Alabama – Remote",
    12: "Alaska – Remote",
    13: "Albania – Remote",
    14: "Algeria – Remote",
    15: "American Samoa – Remote",
    16: "Argentina – Remote",
    17: "Arizona – Remote",
    18: "Arkansas – Remote",
    19: "Armenia – Remote",
    20: "Aruba – Remote",
    21: "Australia – Remote",
    22: "Austria – Remote",
    23: "Azerbaijan – Remote",
    24: "Bahamas – Remote",
    25: "Bahrain – Remote",
    26: "Bangladesh – Remote",
    27: "Barbados – Remote",
    28: "Belarus – Remote",
    29: "Belgium – Remote",
    30: "Bermuda – Remote",
    31: "Bosnia and Herzegovina – Remote",
    32: "Brazil – Remote",
    33: "Bulgaria – Remote",
    34: "California – Remote",
    35: "Canada – Remote",
    36: "Cape Verde – Remote",
    37: "Chile – Remote",
    38: "Colombia – Remote",
    39: "Colorado – Remote",
    40: "Connecticut – Remote",
    41: "Costa Rica – Remote",
    42: "Croatia – Remote",
    43: "Curaçao – Remote",
    44: "Cyprus – Remote",
    45: "Czech Republic – Remote",
    46: "Delaware – Remote",
    47: "Denmark – Remote",
    48: "Dominica – Remote",
    49: "Dominican Republic – Remote",
    50: "Ecuador – Remote",
    51: "Egypt – Remote",
    52: "El Salvador – Remote",
    53: "Estonia – Remote",
    54: "Ethiopia – Remote",
    55: "Finland – Remote",
    56: "Florida – Remote",
    57: "France – Remote",
    58: "Georgia (Country) – Remote",
    59: "Georgia (State) – Remote",
    60: "Germany – Remote",
    61: "Ghana – Remote",
    62: "Gibraltar – Remote",
    63: "Greece – Remote",
    64: "Greenland – Remote",
    65: "Guam – Remote",
    66: "Guatemala – Remote",
    67: "Guernsey – Remote",
    68: "Hawaii – Remote",
    69: "Honduras – Remote",
    70: "Hong Kong – Remote",
    71: "Hungary – Remote",
    72: "Iceland – Remote",
    73: "Idaho – Remote",
    74: "Illinois – Remote",
    75: "India – Remote",
    76: "Indiana – Remote",
    77: "Indonesia – Remote",
    78: "Iowa – Remote",
    79: "Ireland – Remote",
    80: "Isle of Man – Remote",
    81: "Israel – Remote",
    82: "Italy – Remote",
    83: "Jamaica – Remote",
    84: "Japan – Remote",
    85: "Jersey – Remote",
    86: "Jordan – Remote",
    87: "Kansas – Remote",
    88: "Kazakhstan – Remote",
    89: "Kentucky – Remote",
    90: "Kenya – Remote",
    91: "Latvia – Remote",
    92: "Lebanon – Remote",
    93: "Lesotho – Remote",
    94: "Libya – Remote",
    95: "Liechtenstein – Remote",
    96: "Lithuania – Remote",
    97: "Louisiana – Remote",
    98: "Luxembourg – Remote",
    99: "Macedonia – Remote",
    100: "Madagascar – Remote",
    101: "Maine – Remote",
    102: "Malaysia – Remote",
    103: "Maldives – Remote",
    104: "Malta – Remote",
    105: "Maryland – Remote",
    106: "Massachusetts – Remote",
    107: "Mauritius – Remote",
    108: "Mexico – Remote",
    109: "Michigan – Remote",
    110: "Minnesota – Remote",
    111: "Mississippi – Remote",
    112: "Missouri – Remote",
    113: "Moldova – Remote",
    114: "Monaco – Remote",
    115: "Montana – Remote",
    116: "Montenegro – Remote",
    117: "Morocco – Remote",
    118: "Namibia – Remote",
    119: "Nebraska – Remote",
    120: "Netherlands – Remote",
    121: "Nevada – Remote",
    122: "New Hampshire – Remote",
    123: "New Jersey – Remote",
    124: "New Mexico – Remote",
    125: "New York – Remote",
    126: "New Zealand – Remote",
    127: "Nicaragua – Remote",
    128: "Nigeria – Remote",
    129: "North Carolina – Remote",
    130: "North Dakota – Remote",
    131: "Norway – Remote",
    132: "Ohio – Remote",
    133: "Oklahoma – Remote",
    134: "Oman – Remote",
    135: "Oregon – Remote",
    136: "Pakistan – Remote",
    137: "Palau – Remote",
    138: "Palestinian Territory – Remote",
    139: "Panama – Remote",
    140: "Paraguay – Remote",
    141: "Pennsylvania – Remote",
    142: "Peru – Remote",
    143: "Philippines – Remote",
    144: "Poland – Remote",
    145: "Portugal – Remote",
    146: "Puerto Rico – Remote",
    147: "Qatar – Remote",
    148: "Rhode Island – Remote",
    149: "Romania – Remote",
    150: "Russia – Remote",
    151: "Saudi Arabia – Remote",
    152: "Serbia – Remote",
    153: "Seychelles – Remote",
    154: "Singapore – Remote",
    155: "Slovakia – Remote",
    156: "Slovenia – Remote",
    157: "South Africa – Remote",
    158: "South Carolina – Remote",
    159: "South Dakota – Remote",
    160: "South Georgia – Remote",
    161: "South Korea – Remote",
    162: "Spain – Remote",
    163: "Sri Lanka – Remote",
    164: "Suriname – Remote",
    165: "Swaziland – Remote",
    166: "Sweden – Remote",
    167: "Switzerland – Remote",
    168: "Taiwan – Remote",
    169: "Tennessee – Remote",
    170: "Texas – Remote",
    171: "Thailand – Remote",
    172: "Trinidad and Tobago – Remote",
    173: "Turkey – Remote",
    174: "Ukraine – Remote",
    175: "United Arab Emirates – Remote",
    176: "Uruguay – Remote",
    177: "Vermont – Remote",
    178: "Virginia – Remote",
    179: "Washington – Remote",
    180: "West Virginia – Remote",
    181: "Wisconsin – Remote",
    182: "Wyoming – Remote"
}

skills = {
    1056: ".NET", 1057: "AEM", 1058: "Airflow", 1059: "Akka", 1060: "Amazon Redshift",
    1061: "Android", 1062: "Angular", 1063: "Ansible", 1064: "Apache", 1065: "Apollo",
    1066: "ASP.NET", 1067: "Assembly", 1068: "AWS", 1069: "Axio", 1070: "Axure",
    1071: "Azure", 1072: "Babel", 1073: "Backbone", 1074: "Bash", 1075: "Benchmarks",
    1076: "BigQuery", 1077: "Bootstrap", 1078: "C#", 1079: "C++", 1080: "Caffe",
    1081: "Cassandra", 1082: "Chai", 1083: "Chef", 1084: "Citrix", 1085: "Classic ASP",
    1086: "Clojure", 1087: "Cloud", 1088: "Cognos", 1089: "Consul", 1090: "Cyber Security",
    1091: "Cypress", 1092: "D3.js", 1093: "DAC", 1094: "Dagger", 1095: "Dart",
    1096: "Delphi", 1097: "Distributed Systems", 1098: "Django", 1099: "DNS", 1100: "Docker",
    1101: "Drupal", 1102: "DynamoDB", 1103: "EC2", 1104: "ElasticSearch", 1105: "Electron",
    1106: "Elixir", 1107: "Ember.js", 1108: "Entity Framework", 1109: "Erlang", 1110: "ERP",
    1111: "ETL", 1112: "FFmpeg", 1113: "Firebase", 1114: "Firewalls", 1115: "Flash",
    1116: "Flask", 1117: "Flutter", 1118: "Flux", 1119: "Gatsby", 1120: "GCP",
    1121: "Go", 1122: "Google Cloud Platform", 1123: "Gradle", 1124: "Grafana", 1125: "Graphite",
    1126: "GraphQL", 1127: "Greenplum", 1128: "Groovy", 1129: "GRPC", 1130: "Guidewire",
    1131: "GWT", 1132: "Hadoop", 1133: "HAProxy", 1134: "Haskell", 1135: "HBase",
    1136: "HDFS", 1137: "Heroku", 1138: "Hibernate", 1139: "Informatica", 1140: "Invision",
    1141: "Ionic", 1142: "iOS", 1143: "IoT", 1144: "IPFS", 1145: "ITSM",
    1146: "J2EE", 1147: "Jamf", 1148: "Java", 1149: "JavaScript", 1150: "Jenkins",
    1151: "Jest", 1152: "JMeter", 1153: "Joomla", 1154: "jQuery", 1155: "JUnit",
    1156: "Kafka", 1157: "Keras", 1158: "Kotlin", 1159: "Kubernetes", 1160: "LAMP",
    1161: "Laravel", 1162: "Linux", 1163: "Logstash", 1164: "Lua", 1165: "MacOS",
    1166: "Magento", 1167: "MapReduce", 1168: "MariaDB", 1169: "Material UI", 1170: "Matillion",
    1171: "Maven", 1172: "Microservices", 1173: "MobX", 1174: "Mocha", 1175: "Mockito",
    1176: "MongoDB", 1177: "MS SQL Server", 1178: "MySQL", 1179: "Neo4j", 1180: "Next.js",
    1181: "NFS", 1182: "NGINX", 1183: "Node.js", 1184: "NoSQL", 1185: "Numpy",
    1186: "Nuxt", 1187: "Objective-C", 1188: "Open Source", 1189: "OpenCV", 1190: "OpenShift",
    1191: "OpenStack", 1192: "Oracle", 1193: "Oracle ERP", 1194: "Packer", 1195: "PagerDuty",
    1196: "Pandas", 1197: "Perl", 1198: "PHP", 1199: "PMP", 1200: "PostGIS",
    1201: "Postgres", 1202: "Prometheus", 1203: "Pug", 1204: "Pulsar", 1205: "Puppet",
    1206: "Puppeteer", 1207: "PySpark", 1208: "Python", 1209: "PyTorch", 1210: "Qt",
    1211: "RabbitMQ", 1212: "Ray", 1213: "RDBMS", 1214: "React", 1215: "React Native",
    1216: "Realm", 1217: "Redis", 1218: "Redux", 1219: "Remote Sensing", 1220: "Roku",
    1221: "RPA", 1222: "RSpec", 1223: "RTOS", 1224: "Ruby", 1225: "Ruby on Rails",
    1226: "Rust", 1227: "RxJava", 1228: "RxJS", 1229: "RxSwift", 1230: "SaltStack",
    1231: "Scala", 1232: "Scikit-Learn", 1233: "SCSS", 1234: "SDLC", 1235: "Selenium",
    1236: "ServiceNow", 1237: "SFDC", 1238: "Shell Scripting", 1239: "Sitecore", 1240: "SMTP",
    1241: "SOAP", 1242: "Solidity", 1243: "Spark", 1244: "Spinnaker", 1245: "Splunk",
    1246: "Spring", 1247: "Spring Boot", 1248: "Spring Framework", 1249: "SQL", 1250: "SQLite",
    1251: "SSIS", 1252: "Subversion", 1253: "Svelte", 1254: "Swift", 1255: "Switching",
    1256: "Symfony", 1257: "Tableau", 1258: "TCP/IP", 1259: "Tensorflow", 1260: "Terraform",
    1261: "TFS", 1262: "Thrift", 1263: "TypeScript", 1264: "Unity", 1265: "Unix",
    1266: "Vagrant", 1267: "Vault", 1268: "VBA", 1269: "Visualforce", 1270: "VMware",
    1271: "VoIP", 1272: "Vue.js", 1273: "Webpack", 1274: "WordPress", 1275: "WPF",
    1276: "Yarn", 1277: "Zend", 1278: "Zookeeper", 1279: "Agile", 1280: "Scrum",
    1281: "Kanban", 1282: "DevOps", 1283: "CI/CD", 1284: "Git", 1285: "GitHub",
    1286: "GitLab", 1287: "Bitbucket", 1288: "Jira", 1289: "Confluence", 1290: "Trello",
    1291: "Slack", 1292: "Figma", 1293: "Adobe XD", 1294: "Photoshop", 1295: "Illustrator",
    1296: "After Effects", 1297: "Premiere Pro", 1298: "UX Design", 1299: "UI Design", 1300: "Wireframing",
    1301: "Prototyping", 1302: "Data Analysis", 1303: "Data Engineering", 1304: "Machine Learning", 1305: "Deep Learning",
    1306: "Artificial Intelligence", 1307: "Natural Language Processing", 1308: "Computer Vision", 1309: "Business Intelligence", 1310: "Power BI",
    1311: "Looker", 1312: "Snowflake", 1313: "Data Warehousing", 1314: "Data Mining", 1315: "ETL Pipelines",
    1316: "CloudFormation", 1317: "Ansible Tower", 1318: "Jenkins Pipelines", 1319: "Monitoring", 1320: "Observability",
    1321: "Kibana", 1322: "New Relic", 1323: "Datadog", 1324: "Cybersecurity", 1325: "Penetration Testing",
    1326: "Ethical Hacking", 1327: "Network Security", 1328: "Information Security", 1329: "ITIL", 1330: "Blockchain",
    1331: "Cryptography", 1332: "AR/VR Development", 1333: "Game Development", 1334: "Unity 3D", 1335: "Unreal Engine",
    1336: "Robotics", 1337: "Embedded Systems", 1338: "Mobile Development", 1339: "Cross-Platform Development"
}

job_titles = {
    1: "2D Artist", 2: "3D Artist", 3: "Account Executive", 4: "Account Manager", 5: "Accountant",
    6: "Accounts Payable/Receivable", 7: "Actuary", 8: "Administrative Assistant", 9: "Affiliate Manager", 10: "Agile Coach / Scrum Master",
    11: "AI Engineer", 12: "Android Engineer", 13: "Application Engineer", 14: "Art Director", 15: "Auditor",
    16: "Backend Engineer", 17: "Blockchain Engineer", 18: "Bookkeeper", 19: "Brand Ambassador", 20: "Brand Designer",
    21: "Brand Manager", 22: "Business Analyst", 23: "Business Development", 24: "Business Intelligence Analyst", 25: "Business Intelligence Developer",
    26: "Chief Marketing Officer (CMO)", 27: "Chief of Staff", 28: "Chief Operating Officer (COO)", 29: "Client Services", 30: "Cloud Engineer",
    31: "Community Manager", 32: "Compliance Officer", 33: "Computer Vision Engineer", 34: "Content Creator", 35: "Content Marketing Manager",
    36: "Content Manager", 37: "Copywriter", 38: "Customer Advocate", 39: "Customer Retention Specialist", 40: "Customer Success Manager",
    41: "Customer Support Specialist", 42: "Data Analyst", 43: "Data Engineer", 44: "Data Scientist", 45: "Designer",
    46: "Developer Relations (DevRel)", 47: "DevOps & Site Reliability Engineer", 48: "Digital Marketing Manager", 49: "Email Marketing Manager", 50: "Engineering Manager",
    51: "Executive Assistant", 52: "Financial Analyst", 53: "Financial Controller", 54: "Frontend Engineer", 55: "Full-stack Engineer",
    56: "Game Engineer", 57: "General Counsel", 58: "Graphic Designer", 59: "Growth Marketing Manager", 60: "Hardware Engineer",
    61: "Human Resources (HR)", 62: "Implementation Specialist", 63: "IT Support", 64: "Lead Generation Specialist", 65: "Legal Assistant",
    66: "LLM Engineer", 67: "Machine Learning Engineer", 68: "Marketing Analyst", 69: "Marketing Manager", 70: "Marketing Operations",
    71: "Mobile Developer", 72: "Network Engineer", 73: "NLP Engineer", 74: "Onboarding Specialist", 75: "Operations Manager",
    76: "Paralegal", 77: "People Operations", 78: "Performance Marketing", 79: "Platform Engineer", 80: "Pre-sales Engineer",
    81: "Producer", 82: "Product Analyst", 83: "Product Designer (UI/UX)", 84: "Product Manager", 85: "Product Marketing Manager",
    86: "Product Operations Specialist", 87: "Product Specialist", 88: "Program Manager", 89: "Project Manager", 90: "Public Relations (PR)",
    91: "QA Automation Engineer", 92: "QA Engineer", 93: "Recruiter", 94: "Research Analyst", 95: "Research Engineer",
    96: "Research Scientist", 97: "Revenue Operations", 98: "Robotics Engineer", 99: "Sales Development Representative (SDR)", 100: "Sales Engineer",
    101: "Sales Manager", 102: "Sales Operations", 103: "Salesforce Administrator", 104: "Salesforce Developer", 105: "SAP Consultant",
    106: "Security Engineer / Cybersecurity", 107: "ServiceNow Developer", 108: "SEO Specialist", 109: "Smart Contract Engineer", 110: "Social Media Manager",
    111: "Software Engineer", 112: "Solutions Engineer", 113: "Strategy Manager", 114: "Support Engineer", 115: "Systems Administrator",
    116: "Systems Engineer", 117: "Tax Specialist", 118: "Technical Account Manager", 119: "Technical Customer Support", 120: "Technical Product Manager",
    121: "Technical Program Manager", 122: "Technical Recruiter", 123: "UX Researcher", 124: "Video Editor", 125: "Web Designer"
}

def load_set(filepath):
    if not os.path.exists(filepath):
        return set()
    try:
        with open(filepath, 'r') as f:
            return set(json.load(f))
    except Exception:
        return set()

def save_set(data_set, filepath):
    with open(filepath, 'w') as f:
        json.dump(list(data_set), f, indent=2)

def get_last_page():
    if not os.path.exists(TRACKER_FILE):
        return 1
    try:
        with open(TRACKER_FILE, 'r') as f:
            data = json.load(f)
            return data.get("last_page", 1)
    except Exception:
        return 1

def save_last_page(page):
    with open(TRACKER_FILE, 'w') as f:
        json.dump({"last_page": page, "updated_at": time.time()}, f, indent=2)

def extract_salary_info(raw_job):
    """Robust extractor covering nested objects, root numbers, and string ranges."""
    salary_obj = raw_job.get("salaryRange") or {}
    
    s_min = salary_obj.get("min") or raw_job.get("salaryMin") or raw_job.get("minSalary")
    s_max = salary_obj.get("max") or raw_job.get("salaryMax") or raw_job.get("maxSalary")
    period = salary_obj.get("salaryType") or raw_job.get("salaryPeriod") or "year"

    # Fallback to string extraction if numbers are missing
    if not s_min and not s_max:
        raw_str = salary_obj.get("salaryHumanReadableText") or raw_job.get("salary") or ""
        matches = re.findall(r'[\$£€]?\s*(\d+[\d,]*)', str(raw_str))
        if matches:
            cleaned = [int(m.replace(',', '')) for m in matches if m.replace(',', '').isdigit()]
            if len(cleaned) == 1:
                s_min = cleaned[0]
            elif len(cleaned) >= 2:
                s_min, s_max = min(cleaned), max(cleaned)

    # Convert valid floats/strings to clean ints
    try:
        s_min = int(float(s_min)) if s_min else None
    except (ValueError, TypeError):
        s_min = None

    try:
        s_max = int(float(s_max)) if s_max else None
    except (ValueError, TypeError):
        s_max = None

    if s_min or s_max:
        return {
            "min": s_min,
            "max": s_max,
            "period": f"/{period.replace('per ', '').strip()}"
        }
    return None

def save_logo_to_cdn(image_url, company_name="company"):
    if not image_url or not str(image_url).startswith("http"):
        return None

    try:
        os.makedirs(CDN_LOGOS_DIR, exist_ok=True)
        res = requests.get(image_url, timeout=10)
        res.raise_for_status()

        content_type = res.headers.get("content-type", "image/png").lower()
        if "jpeg" in content_type or "jpg" in content_type:
            ext = "jpg"
        elif "webp" in content_type:
            ext = "webp"
        elif "svg" in content_type:
            ext = "svg"
        else:
            ext = "png"

        file_name = f"{slugify(company_name)}-{int(time.time())}.{ext}"
        target_path = os.path.join(CDN_LOGOS_DIR, file_name)

        with open(target_path, "wb") as f:
            f.write(res.content)

        return f"{CDN_PUBLIC_BASE_URL.rstrip('/')}/{file_name}"
    except Exception as e:
        print(f"    [!] Failed to save logo locally ({e}), falling back to remote URL.")
        return image_url

def fetch_latest_page(page=1, items_per_page=50):
    headers = {
        "Authorization": f"Bearer {ROCKETSHIP_API_KEY}",
        "Content-Type": "application/json",
        "RR-API-Version": "1",
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
        "Accept": "application/json, text/plain, */*",
        "Origin": "https://www.remoterocketship.com",
        "Referer": "https://www.remoterocketship.com/"
    }

    payload = {
        "filters": {
            "page": page,
            "itemsPerPage": items_per_page,
            "jobTitleFilters": [
                "Full Stack Engineer",
                "Software Engineer",
                "Backend Engineer",
                "Frontend Engineer",
                "DevOps Engineer"
            ],
            "locationFilters": ["Worldwide", "Anywhere", "United States"],
            "sortBy": "datePosted",
            "sortOrder": "desc"
        },
        "includeJobDescription": True
    }

    res = requests.post(ROCKETSHIP_ENDPOINT, headers=headers, json=payload, impersonate="chrome120", timeout=30)
    
    if res.status_code == 429:
        print(f"[!] Quota reached (429): {res.text}")
        return None, False

    if res.status_code != 200:
        print(f"[!] API error on page {page} ({res.status_code}): {res.text}")
        return None, False

    data = res.json()
    batch = data.get("jobOpenings", [])
    has_next = data.get("pagination", {}).get("hasNextPage", False)
    return batch, has_next

def clean_and_rewrite_with_gemini(raw_job, salary_data):
    model = genai.GenerativeModel('gemini-2.5-flash')

    prompt = f"""
    You are an expert SEO copywriter and technical data engineer.
    Analyze the following raw job posting data. Rewrite textual fields for high-ranking SEO while matching the schema accurately.

    Return ONLY a single valid JSON object (no markdown quotes, no triple backticks) with these exact keys:
    "title", "job_titles", "description", "excerpts", "requirements", "date_posted", "benefits",
    "job_type", "job_position", "department", "job_experience", "salary_min", "salary_max",
    "currency", "salary_period", "visa_sponsorship", "degree_required", "apply_url", "location",
    "company_name", "company_logo", "skills", "about_company", "company_linkedin", "company_website".

    Rules:
    1. "description": Thoroughly rewrite into high-ranking, natural SEO copy. Keep all stack specifics. Strip all HTML.
    2. "requirements": Numbered list (1., 2., 3.).
    3. "benefits": Dashed list (- Health, - 401k) or null if not found.
    4. "excerpts": Crisp meta-description summary between 150 and 175 characters.
    5. "job_titles": Best single integer ID from: {job_titles}
    6. "skills": Matching IDs from: {skills} as a comma-separated string (max 10).
    7. "location": Best match ID from: {locations} (default to 1).
    8. "job_position": 'Entry-Level', 'Junior', 'Mid-Level', or 'Senior'.
    9. "salary_min": {salary_data.get('min')}
    10. "salary_max": {salary_data.get('max')}
    11. "salary_period": "{salary_data.get('period', '/year')}"
    12. "degree_required" and "visa_sponsorship": Strict booleans.
    13. "apply_url": Preserve input apply_url exactly.

    Raw Job Input:
    {json.dumps(raw_job, indent=2)}
    """

    try:
        response = model.generate_content(prompt)
        text = response.text.strip().replace('```json', '').replace('```', '')
        return json.loads(text)
    except Exception as e:
        print(f"    [!] Error during Gemini rewrite: {e}")
        return None

def push_to_hive(payload):
    headers = {
        'Content-Type': 'application/json',
        'x-api-key': HIVER_API_KEY
    }
    res = requests.post(HIVER_ENDPOINT, headers=headers, json=payload, timeout=20)
    if res.status_code not in (200, 201):
        print(f"    [!] Upload failed ({res.status_code}): {res.text}")
    res.raise_for_status()
    print("    -> Successfully synced to RemoteJobsHive backend.")

def run_pipeline(target_count=50):
    seen = load_set(SEEN_FILE)
    failed = load_set(FAILED_FILE)

    current_page = get_last_page()
    added_count = 0

    print(f"\n=======================================================")
    print(f"[*] Starting Resilient Sync Run: Target = {target_count} jobs with verified salary")
    print(f"[*] Starting at Page: {current_page}")
    print(f"[*] Total previously cached entries: {len(seen)}")
    print(f"=======================================================\n")

    while added_count < target_count:
        print(f"[*] Requesting Page {current_page} (50 items) from Remote Rocketship...")
        batch, has_next = fetch_latest_page(page=current_page, items_per_page=50)

        # Handle API rate limit / server error without resetting progress
        if batch is None:
            print("[*] API halted due to error/quota. Preserving page tracker position.")
            break

        # Reached natural end of listings
        if len(batch) == 0:
            print("[*] Reached end of available job pages. Looping back to page 1.")
            save_last_page(1)
            break

        for raw_job in batch:
            if added_count >= target_count:
                break

            job_id = str(raw_job.get("id") or raw_job.get("slug"))
            apply_url = raw_job.get("url")
            company = raw_job.get("company", {}).get("name", "Unknown")
            title = raw_job.get("roleTitle", "Unknown")

            # 1. Deduplication check
            if job_id in seen or (apply_url and apply_url in seen):
                continue

            # 2. Blacklist check
            if company.lower() in blacklisted_companies:
                seen.add(job_id)
                if apply_url:
                    seen.add(apply_url)
                continue

            # 3. Robust salary extraction across all fields
            salary_data = extract_salary_info(raw_job)
            if not salary_data:
                # Mark as seen so this unsalaried job is never re-processed
                seen.add(job_id)
                if apply_url:
                    seen.add(apply_url)
                continue

            print(f"\n[{added_count + 1}/{target_count}] Processing: {title} @ {company}")
            print(f"    Salary Found: Min={salary_data['min']}, Max={salary_data['max']}, Period={salary_data['period']}")

            try:
                structured = clean_and_rewrite_with_gemini(raw_job, salary_data)
                if not structured:
                    raise ValueError("Gemini returned invalid payload")

                raw_logo = raw_job.get("company", {}).get("logoUrl") or structured.get("company_logo")
                cdn_logo_url = save_logo_to_cdn(raw_logo, structured.get("company_name", company))

                payload = {
                    "title": structured['title'],
                    "job_title": structured['job_titles'],
                    "description": structured['description'],
                    "requirements": structured['requirements'],
                    "benefits": structured.get('benefits'),
                    "job_type": structured.get('job_type', 'Full-Time'),
                    "job_position": structured['job_position'],
                    "salary_min": structured.get('salary_min') or salary_data['min'],
                    "salary_max": structured.get('salary_max') or salary_data['max'],
                    "salary": structured.get('salary_period') or salary_data['period'],
                    "visa_sponsorship": structured.get('visa_sponsorship', False),
                    "degree_required": structured.get('degree_required', False),
                    "apply_url": structured['apply_url'],
                    "date_posted": structured.get('date_posted') or raw_job.get('createdAt'),
                    "location_id": structured['location'],
                    "company_name": structured['company_name'],
                    "company_logo": cdn_logo_url,
                    "about_company": structured.get('about_company'),
                    "job_experience": structured.get('job_experience'),
                    "department": structured.get('department'),
                    "company_linkedin": structured.get('company_linkedin'),
                    "company_website": structured.get('company_website'),
                    "company_slug": slugify(structured['company_name']),
                    "excerpts": structured['excerpts'],
                    "slug": slugify(f"{structured['title']}-{structured['company_name']}"),
                    "skills": structured['skills'],
                    "source": "hiver"
                }

                push_to_hive(payload)

                added_count += 1
                seen.add(job_id)
                if apply_url:
                    seen.add(apply_url)
                save_set(seen, SEEN_FILE)

            except Exception as e:
                print(f"    [!] Error syncing job {job_id}: {e}")
                failed.add(job_id)
                save_set(failed, FAILED_FILE)

            time.sleep(1)

        save_set(seen, SEEN_FILE)

        if not has_next:
            print("[*] Reached end of pagination. Looping back to page 1.")
            save_last_page(1)
            break

        current_page += 1
        save_last_page(current_page)

    print(f"\n[✓] Run concluded. Added {added_count} new postings.")
    print(f"[✓] Current tracker saved at page {current_page}.\n")

if __name__ == "__main__":
    run_pipeline(target_count=50)