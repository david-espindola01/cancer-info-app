-- English names for tables, columns, constraints and stored values. The data is kept:
-- documents, chunks with their notes and memories are renamed in place.

-- documents
alter table documentos rename to documents;
alter table documents rename column titulo to title;
alter table documents rename column huella to fingerprint;
alter table documents rename column estado to status;
alter table documents rename column creado_en to created_at;
alter table documents rename column actualizado_en to updated_at;
alter table documents drop constraint documentos_estado_check;
update documents set status = case status
  when 'pendiente' then 'pending'
  when 'procesando' then 'processing'
  when 'listo' then 'ready'
  else status
end;
alter table documents alter column status set default 'pending';
alter table documents add constraint documents_status_check
  check (status in ('pending', 'processing', 'ready', 'error'));
alter table documents rename constraint documentos_pkey to documents_pkey;
alter table documents rename constraint documentos_huella_key to documents_fingerprint_key;

-- chunks
alter table fragmentos rename to chunks;
alter table chunks rename column documento_id to document_id;
alter table chunks rename column orden to position;
alter table chunks rename column texto to text;
alter table chunks rename column notas to notes;
alter table chunks rename constraint fragmentos_pkey to chunks_pkey;
alter table chunks rename constraint fragmentos_documento_id_fkey to chunks_document_id_fkey;

-- memories
alter table memorias rename to memories;
alter table memories rename column documento_id to document_id;
alter table memories rename column contenido to content;
alter table memories rename column busqueda to search;
alter table memories rename column actualizada_en to updated_at;
alter table memories rename constraint memorias_pkey to memories_pkey;
alter table memories rename constraint memorias_documento_id_fkey to memories_document_id_fkey;
alter index memorias_busqueda_idx rename to memories_search_idx;

-- pages: cached UI used the old component names, so it is discarded and regenerated.
alter table paginas rename to pages;
alter table pages rename column tema to topic;
alter table pages rename column palabras_clave to keywords;
alter table pages rename column version_corpus to corpus_version;
alter table pages rename column estado to status;
alter table pages rename column actualizada_en to updated_at;
alter table pages rename column fuentes to sources;
alter table pages drop constraint paginas_estado_check;
delete from pages;
alter table pages add constraint pages_status_check check (status in ('generating', 'ready', 'error'));
alter table pages rename constraint paginas_pkey to pages_pkey;

-- ai_usage
alter table uso_ia rename to ai_usage;
alter table ai_usage rename column dia to day;
alter table ai_usage rename column motivo to reason;
alter table ai_usage rename column cantidad to amount;
alter table ai_usage rename constraint uso_ia_pkey to ai_usage_pkey;
update ai_usage set reason = 'prefetch' where reason = 'precarga';

-- rate_limits: the keys used Spanish reasons; the windows are short, so they are reset.
alter table limite_peticiones rename to rate_limits;
alter table rate_limits rename column clave to key;
alter table rate_limits rename column ventana_inicio to window_start;
alter table rate_limits rename column cantidad to count;
alter table rate_limits rename constraint limite_peticiones_pkey to rate_limits_pkey;
delete from rate_limits;

-- JSON keys of the Reader Agent's notes and memories.
create function pg_temp.english_json(value jsonb) returns jsonb language plpgsql immutable as $$
declare
  names constant jsonb := '{
    "hallazgos": "findings", "cifras": "figures", "conceptos": "concepts", "limitaciones": "limitations",
    "datosDeCita": "citation", "valor": "value", "descripcion": "description", "termino": "term",
    "explicacion": "explanation", "tituloSencillo": "plainTitle", "ideaCentral": "mainIdea",
    "resumenSencillo": "plainSummary", "texto": "text", "solidez": "strength",
    "recomendaciones": "recommendations", "temas": "topics", "referencia": "reference",
    "autores": "authors", "anio": "year", "revista": "journal"
  }';
  strengths constant jsonb := '{"alta": "high", "media": "medium", "baja": "low"}';
  result jsonb := '{}';
  entry record;
  name text;
  item jsonb;
begin
  case jsonb_typeof(value)
    when 'object' then
      for entry in select * from jsonb_each(value) loop
        name := coalesce(names ->> entry.key, entry.key);
        item := pg_temp.english_json(entry.value);
        if name = 'strength' then
          item := coalesce(strengths -> (item #>> '{}'), item);
        elsif name in ('authors', 'year', 'journal') and (item #>> '{}') ~* '^\s*no indicado\s*$' then
          item := '""';
        end if;
        result := result || jsonb_build_object(name, item);
      end loop;
      return result;
    when 'array' then
      return coalesce((select jsonb_agg(pg_temp.english_json(element) order by idx)
                       from jsonb_array_elements(value) with ordinality as e(element, idx)), '[]');
    else
      return value;
  end case;
end
$$;

update chunks set notes = pg_temp.english_json(notes) where notes is not null;
update memories set content = pg_temp.english_json(content);
