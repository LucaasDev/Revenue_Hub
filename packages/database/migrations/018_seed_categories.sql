-- ============================================================
-- 018_seed_categories.sql — Categorias padrão do sistema
-- Executado após criação de um workspace via trigger (handle_new_user)
-- ou chamado manualmente ao criar workspace adicional.
-- ============================================================

-- Função auxiliar para seed de categorias em um workspace
create or replace function seed_workspace_categories(p_workspace_id uuid)
returns void language plpgsql security definer as $$
declare
  -- IDs para categorias pai de despesa
  cat_alimentacao   uuid := gen_random_uuid();
  cat_transporte    uuid := gen_random_uuid();
  cat_moradia       uuid := gen_random_uuid();
  cat_saude         uuid := gen_random_uuid();
  cat_educacao      uuid := gen_random_uuid();
  cat_lazer         uuid := gen_random_uuid();
  cat_vestuario     uuid := gen_random_uuid();
  cat_servicos      uuid := gen_random_uuid();
  cat_outros_exp    uuid := gen_random_uuid();
  -- IDs para categorias pai de receita
  cat_salario       uuid := gen_random_uuid();
  cat_freelance     uuid := gen_random_uuid();
  cat_investimentos uuid := gen_random_uuid();
  cat_presente      uuid := gen_random_uuid();
  cat_outros_rec    uuid := gen_random_uuid();
begin
  -- ========================
  -- DESPESAS — categorias pai
  -- ========================
  insert into categories (id, workspace_id, name, type, icon, color, is_system, sort_order) values
    (cat_alimentacao,   p_workspace_id, 'Alimentação',   'expense', 'utensils',      '#EF4444', true, 1),
    (cat_transporte,    p_workspace_id, 'Transporte',    'expense', 'car',           '#F97316', true, 2),
    (cat_moradia,       p_workspace_id, 'Moradia',       'expense', 'home',          '#EAB308', true, 3),
    (cat_saude,         p_workspace_id, 'Saúde',         'expense', 'heart-pulse',   '#EC4899', true, 4),
    (cat_educacao,      p_workspace_id, 'Educação',      'expense', 'graduation-cap','#8B5CF6', true, 5),
    (cat_lazer,         p_workspace_id, 'Lazer',         'expense', 'gamepad-2',     '#06B6D4', true, 6),
    (cat_vestuario,     p_workspace_id, 'Vestuário',     'expense', 'shirt',         '#14B8A6', true, 7),
    (cat_servicos,      p_workspace_id, 'Serviços',      'expense', 'wrench',        '#6366F1', true, 8),
    (cat_outros_exp,    p_workspace_id, 'Outros',        'expense', 'ellipsis',      '#6B7280', true, 9);

  -- DESPESAS — subcategorias
  insert into categories (workspace_id, parent_id, name, type, is_system, sort_order) values
    -- Alimentação
    (p_workspace_id, cat_alimentacao, 'Supermercado',      'expense', true, 1),
    (p_workspace_id, cat_alimentacao, 'Restaurante',       'expense', true, 2),
    (p_workspace_id, cat_alimentacao, 'Delivery',          'expense', true, 3),
    (p_workspace_id, cat_alimentacao, 'Padaria / Café',    'expense', true, 4),
    -- Transporte
    (p_workspace_id, cat_transporte, 'Combustível',        'expense', true, 1),
    (p_workspace_id, cat_transporte, 'Transporte público', 'expense', true, 2),
    (p_workspace_id, cat_transporte, 'Aplicativo (Uber)',  'expense', true, 3),
    (p_workspace_id, cat_transporte, 'Manutenção veículo', 'expense', true, 4),
    -- Moradia
    (p_workspace_id, cat_moradia, 'Aluguel',               'expense', true, 1),
    (p_workspace_id, cat_moradia, 'Condomínio',            'expense', true, 2),
    (p_workspace_id, cat_moradia, 'Energia elétrica',      'expense', true, 3),
    (p_workspace_id, cat_moradia, 'Água / Gás',            'expense', true, 4),
    (p_workspace_id, cat_moradia, 'Internet / Telefone',   'expense', true, 5),
    -- Saúde
    (p_workspace_id, cat_saude, 'Plano de saúde',          'expense', true, 1),
    (p_workspace_id, cat_saude, 'Farmácia',                'expense', true, 2),
    (p_workspace_id, cat_saude, 'Consulta médica',         'expense', true, 3),
    (p_workspace_id, cat_saude, 'Academia / Esportes',     'expense', true, 4),
    -- Educação
    (p_workspace_id, cat_educacao, 'Mensalidade escolar',  'expense', true, 1),
    (p_workspace_id, cat_educacao, 'Cursos / Livros',      'expense', true, 2),
    -- Lazer
    (p_workspace_id, cat_lazer, 'Streaming',               'expense', true, 1),
    (p_workspace_id, cat_lazer, 'Cinema / Teatro',         'expense', true, 2),
    (p_workspace_id, cat_lazer, 'Viagem',                  'expense', true, 3),
    -- Serviços
    (p_workspace_id, cat_servicos, 'Assinaturas',          'expense', true, 1),
    (p_workspace_id, cat_servicos, 'Seguros',              'expense', true, 2);

  -- ========================
  -- RECEITAS — categorias pai
  -- ========================
  insert into categories (id, workspace_id, name, type, icon, color, is_system, sort_order) values
    (cat_salario,       p_workspace_id, 'Salário',        'income', 'briefcase',   '#22C55E', true, 1),
    (cat_freelance,     p_workspace_id, 'Freelance',      'income', 'laptop',      '#10B981', true, 2),
    (cat_investimentos, p_workspace_id, 'Investimentos',  'income', 'trending-up', '#3B82F6', true, 3),
    (cat_presente,      p_workspace_id, 'Presente',       'income', 'gift',        '#A855F7', true, 4),
    (cat_outros_rec,    p_workspace_id, 'Outros',         'income', 'ellipsis',    '#6B7280', true, 5);

  -- RECEITAS — subcategorias
  insert into categories (workspace_id, parent_id, name, type, is_system, sort_order) values
    (p_workspace_id, cat_salario,       'Salário fixo',      'income', true, 1),
    (p_workspace_id, cat_salario,       '13º salário',       'income', true, 2),
    (p_workspace_id, cat_salario,       'Férias',            'income', true, 3),
    (p_workspace_id, cat_investimentos, 'Dividendos',        'income', true, 1),
    (p_workspace_id, cat_investimentos, 'Renda fixa',        'income', true, 2),
    (p_workspace_id, cat_investimentos, 'Aluguel recebido',  'income', true, 3);

end;
$$;

-- Atualizar o trigger handle_new_user para chamar seed de categorias
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
declare
  new_workspace_id uuid;
  base_slug text;
  final_slug text;
  counter int := 0;
begin
  -- Criar profile
  insert into profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  );

  -- Gerar slug único
  base_slug := lower(regexp_replace(
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    '[^a-z0-9]+', '-', 'g'
  ));
  final_slug := base_slug;
  while exists (select 1 from workspaces where slug = final_slug) loop
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  end loop;

  -- Criar workspace pessoal
  insert into workspaces (name, slug, owner_id)
  values (
    coalesce(new.raw_user_meta_data->>'full_name', 'Meu Workspace'),
    final_slug,
    new.id
  )
  returning id into new_workspace_id;

  -- Adicionar como owner
  insert into workspace_members (workspace_id, user_id, role)
  values (new_workspace_id, new.id, 'owner');

  -- Seed de categorias padrão
  perform seed_workspace_categories(new_workspace_id);

  return new;
end;
$$;
