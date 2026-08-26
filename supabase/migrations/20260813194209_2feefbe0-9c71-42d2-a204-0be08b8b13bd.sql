CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE TABLE public.articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  excerpt text NOT NULL DEFAULT '',
  content text NOT NULL DEFAULT '',
  author_name text NOT NULL DEFAULT '',
  tags text[] NOT NULL DEFAULT '{}',
  published boolean NOT NULL DEFAULT false,
  published_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.articles TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.articles TO authenticated;
GRANT ALL ON public.articles TO service_role;
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read published articles" ON public.articles
  FOR SELECT USING (published = true);

CREATE POLICY "Admins can read all articles" ON public.articles
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert articles" ON public.articles
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update articles" ON public.articles
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete articles" ON public.articles
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER articles_set_updated_at
BEFORE UPDATE ON public.articles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.assign_first_user_admin()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user')
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_assign_role
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.assign_first_user_admin();

INSERT INTO public.articles (title, slug, excerpt, content, author_name, tags, published, published_at) VALUES
('[Atualizado] Site e serviços: manutenção de emergência', 'manutencao-de-emergencia-site-e-servicos', 'Estamos respondendo a uma emergência causada por uma falha nos sistemas de refrigeração do nosso data center.', E'Prezados clientes,\n\nEstamos respondendo a uma emergência causada por uma falha nos sistemas de refrigeração do nosso data center. Como resultado, os seguintes serviços podem ser afetados:\n\n- Hospedagem compartilhada, VPS e dedicada: sites podem estar lentos ou indisponíveis.\n- DNS: a resolução de zonas está disponível; o gerenciamento está afetado.\n- E-mail: a entrega de mensagens pode sofrer atrasos.\n\nNossa equipe está trabalhando para restaurar tudo o mais rápido possível. Agradecemos a paciência.', 'Ted V.', ARRAY['Hospedagem','E-mail','DNS'], true, now() - interval '2 hours'),
('[Concluído] Manutenção programada do registro', 'manutencao-programada-do-registro', 'A manutenção programada foi concluída com sucesso e todos os serviços estão operando normalmente.', E'A manutenção programada do registro foi concluída dentro da janela prevista.\n\nDurante a janela, registros, renovações e transferências ficaram temporariamente indisponíveis. Todas as operações pendentes já foram processadas.\n\nObrigado pela compreensão.', 'Pavithra Ramesh', ARRAY['Domínios'], true, now() - interval '7 days'),
('Melhorias de desempenho na rede', 'melhorias-de-desempenho-na-rede', 'Implantamos novas rotas de rede para reduzir a latência em regiões da América do Sul.', E'Implantamos novas rotas de rede para reduzir a latência em regiões da América do Sul.\n\nNão é esperada nenhuma interrupção. Caso perceba qualquer comportamento incomum, entre em contato com o suporte.', 'Equipe de Infraestrutura', ARRAY['Rede'], true, now() - interval '21 days');