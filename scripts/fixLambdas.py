import glob
import re

files = glob.glob('.amplify/generated/env/*.ts')
pattern = r'type AmplifyBackendEnvVars\s*=\s*\{\s*\};'
replacement = 'type AmplifyBackendEnvVars = {\n  AMPLIFY_DATA_DEFAULT_NAME: string;\n};'

for f in files:
    content = open(f).read()
    if re.search(pattern, content):
        content = re.sub(pattern, replacement, content)
        open(f, 'w').write(content)
        print(f.split('/')[-1], 'OK')
    else:
        print(f.split('/')[-1], 'Skipped (Pattern not found)')