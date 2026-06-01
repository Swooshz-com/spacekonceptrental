import os
import glob

directory = 'website/test'
files = glob.glob(os.path.join(directory, '*.test.ts'))

bad_str = '      "This phase implements only the missing server-only runtime dependency boundary needed by the existing CSRF proof issuer/verifier contracts. The actual route implementation is intentionally deferred because the required runtime `signCsrfProof` and `generateNonce` dependencies are not yet implemented or approved. This phase preserves the existing `admin.csrf.issue` operation policy and preflight boundaries. This phase does not add product/category/product image writes, admin UI, pages, server actions, login/logout, protected admin pages, Storage, deployment, Supabase Cloud, browser Supabase, service-role runtime paths, n8n workflow changes, Pinecone runtime code, SaaS chatbot work, or `website/chat-config.js` access."'

good_str = '      "This phase implements only the missing server-only runtime dependency boundary needed by the existing CSRF proof issuer/verifier contracts. It provides nonce generation, signing, and signature verification using Node server-only crypto. This phase does not implement the actual CSRF proof issuer route. This phase does not add product/category/product image writes, admin UI, pages, server actions, login/logout, protected admin pages, Storage, deployment, Supabase Cloud, browser Supabase, service-role runtime paths, n8n workflow changes, Pinecone runtime code, SaaS chatbot work, or `website/chat-config.js` access."'

for filepath in files:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    if bad_str in content:
        content = content.replace(bad_str, good_str)
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Fixed {filepath}")

# Also, phase-2b-af-admin-csrf-issuer-route-readiness-boundary.test.ts had a partial match. Let's fix it just in case:
bad_str_partial = 'expect(status).toContain("This phase implements only the missing server-only runtime dependency boundary needed by the existing CSRF proof issuer/verifier contracts");'
good_str_partial = 'expect(status).toContain("This phase implements only the missing server-only runtime dependency boundary needed by the existing CSRF proof issuer/verifier contracts. It provides nonce generation, signing, and signature verification using Node server-only crypto. This phase does not implement the actual CSRF proof issuer route. This phase does not add product/category/product image writes, admin UI, pages, server actions, login/logout, protected admin pages, Storage, deployment, Supabase Cloud, browser Supabase, service-role runtime paths, n8n workflow changes, Pinecone runtime code, SaaS chatbot work, or `website/chat-config.js` access.");'

for filepath in files:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
        
    if bad_str_partial in content:
        content = content.replace(bad_str_partial, good_str_partial)
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Fixed partial in {filepath}")
