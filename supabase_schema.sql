-- 1. Create Documents Table
CREATE TABLE IF NOT EXISTS public.documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID,
    name TEXT NOT NULL,
    mode TEXT NOT NULL DEFAULT 'general',
    file_type TEXT NOT NULL,
    storage_path TEXT,
    full_text TEXT,
    page_count INTEGER DEFAULT 1,
    file_size INTEGER DEFAULT 0,
    is_large BOOLEAN DEFAULT FALSE,
    summary_json JSONB,
    suggested_actions JSONB,
    starred BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create Workspaces Table
CREATE TABLE IF NOT EXISTS public.workspaces (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID,
    name TEXT NOT NULL,
    mode TEXT NOT NULL DEFAULT 'general',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create Workspace Documents Junction Table
CREATE TABLE IF NOT EXISTS public.workspace_documents (
    workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
    document_id UUID REFERENCES public.documents(id) ON DELETE CASCADE,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (workspace_id, document_id)
);

-- 4. Create App State Table (Single Row for MVP)
CREATE TABLE IF NOT EXISTS public.app_state (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    active_mode TEXT,
    onboarding_done BOOLEAN DEFAULT FALSE,
    theme TEXT DEFAULT 'light',
    sidebar_collapsed BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default state
INSERT INTO public.app_state (id, active_mode, onboarding_done, theme, sidebar_collapsed)
VALUES (1, NULL, FALSE, 'light', FALSE)
ON CONFLICT (id) DO NOTHING;

-- 5. Create Chat Messages Table
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    document_id UUID REFERENCES public.documents(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Create Generated Outputs Table
CREATE TABLE IF NOT EXISTS public.generated_outputs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    document_id UUID REFERENCES public.documents(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    content TEXT NOT NULL,
    length TEXT,
    tone TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Set up RLS (Allow all for MVP)
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_outputs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations for documents" ON public.documents FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for workspaces" ON public.workspaces FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for workspace_documents" ON public.workspace_documents FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for app_state" ON public.app_state FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for chat_messages" ON public.chat_messages FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for generated_outputs" ON public.generated_outputs FOR ALL USING (true) WITH CHECK (true);
