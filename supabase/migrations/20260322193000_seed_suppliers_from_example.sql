-- Seed example suppliers, capabilities, and search documents.

with inserted_supplier as (
  insert into public.suppliers (
    name,
    website,
    contact_url,
    country,
    notes
  )
  select
    'Drader Manufacturing',
    'https://www.drader.com/',
    'https://www.drader.com/contact-us/',
    'Canada',
    'Based in Edmonton and Brampton; specializes in both custom molding and proprietary transport products.'
  where not exists (
    select 1 from public.suppliers where name = 'Drader Manufacturing'
  )
  returning id
), resolved_supplier as (
  select id from inserted_supplier
  union all
  select id from public.suppliers where name = 'Drader Manufacturing' limit 1
), inserted_capability as (
  insert into public.supplier_capabilities (
    supplier_id,
    capability_type,
    description,
    regions_served
  )
  select
    id,
    'custom injection molding',
    'Milk crates; Bakery baskets; Warehouse bins; Plastic welding equipment (Injectiweld); Custom injection molded parts.',
    array['Canada']
  from resolved_supplier
  returning id, supplier_id
)
insert into public.supplier_search_documents (
  supplier_id,
  capability_id,
  document_text,
  metadata
)
select
  supplier_id,
  id,
  'Drader Manufacturing. Products: Milk crates, bakery baskets, warehouse bins, plastic welding equipment (Injectiweld), custom injection molded parts. Notes: Based in Edmonton and Brampton; specializes in custom molding and proprietary transport products.',
  jsonb_build_object(
    'source', 'example_seed',
    'company_name', 'Drader Manufacturing',
    'website', 'https://www.drader.com/'
  )
from inserted_capability;

with inserted_supplier as (
  insert into public.suppliers (
    name,
    website,
    contact_url,
    country,
    notes
  )
  select
    'Plastec',
    'https://www.plastec.ca/',
    'https://www.plastec.ca/contact/',
    'Canada',
    'Leading fabricator in Western Canada (Vancouver-based) focusing on custom design and prototyping.'
  where not exists (
    select 1 from public.suppliers where name = 'Plastec'
  )
  returning id
), resolved_supplier as (
  select id from inserted_supplier
  union all
  select id from public.suppliers where name = 'Plastec' limit 1
), inserted_capability as (
  insert into public.supplier_capabilities (
    supplier_id,
    capability_type,
    description,
    regions_served
  )
  select
    id,
    'plastic fabrication and prototyping',
    'Acrylic displays; Polycarbonate guards; Custom vacuum formed components; CNC machined plastic parts.',
    array['Canada']
  from resolved_supplier
  returning id, supplier_id
)
insert into public.supplier_search_documents (
  supplier_id,
  capability_id,
  document_text,
  metadata
)
select
  supplier_id,
  id,
  'Plastec. Products: acrylic displays, polycarbonate guards, custom vacuum formed components, CNC machined plastic parts. Notes: Vancouver-based fabricator focused on custom design and prototyping.',
  jsonb_build_object(
    'source', 'example_seed',
    'company_name', 'Plastec',
    'website', 'https://www.plastec.ca/'
  )
from inserted_capability;

with inserted_supplier as (
  insert into public.suppliers (
    name,
    website,
    contact_url,
    country,
    notes
  )
  select
    'Johnston Industrial Plastics',
    'https://www.johnstonplastics.com/',
    'https://www.johnstonplastics.com/contact/',
    'Canada',
    'One of Canada''s oldest distributors and fabricators with facilities in Toronto, Montreal, Winnipeg, and Edmonton.'
  where not exists (
    select 1 from public.suppliers where name = 'Johnston Industrial Plastics'
  )
  returning id
), resolved_supplier as (
  select id from inserted_supplier
  union all
  select id from public.suppliers where name = 'Johnston Industrial Plastics' limit 1
), inserted_capability as (
  insert into public.supplier_capabilities (
    supplier_id,
    capability_type,
    description,
    regions_served
  )
  select
    id,
    'industrial plastics distribution and machining',
    'Plastic sheets, rods, and tubes; Corrosion-resistant CPVC components; Machined engineering plastics (PEEK, Acetal); Custom fabricated industrial shapes.',
    array['Canada']
  from resolved_supplier
  returning id, supplier_id
)
insert into public.supplier_search_documents (
  supplier_id,
  capability_id,
  document_text,
  metadata
)
select
  supplier_id,
  id,
  'Johnston Industrial Plastics. Products: plastic sheets, rods, tubes, CPVC components, machined engineering plastics (PEEK, Acetal), custom fabricated industrial shapes. Notes: Multi-city Canadian footprint including Toronto, Montreal, Winnipeg, Edmonton.',
  jsonb_build_object(
    'source', 'example_seed',
    'company_name', 'Johnston Industrial Plastics',
    'website', 'https://www.johnstonplastics.com/'
  )
from inserted_capability;

with inserted_supplier as (
  insert into public.suppliers (
    name,
    website,
    contact_url,
    country,
    notes
  )
  select
    'Polykar',
    'https://www.polykar.com/',
    'https://www.polykar.com/en/contact-us',
    'Canada',
    'Focuses heavily on sustainable and recycled flexible packaging solutions.'
  where not exists (
    select 1 from public.suppliers where name = 'Polykar'
  )
  returning id
), resolved_supplier as (
  select id from inserted_supplier
  union all
  select id from public.suppliers where name = 'Polykar' limit 1
), inserted_capability as (
  insert into public.supplier_capabilities (
    supplier_id,
    capability_type,
    description,
    regions_served
  )
  select
    id,
    'flexible packaging',
    'Recycled garbage bags; Compostable packaging; Food-approved bags; Industrial flexible film.',
    array['Canada']
  from resolved_supplier
  returning id, supplier_id
)
insert into public.supplier_search_documents (
  supplier_id,
  capability_id,
  document_text,
  metadata
)
select
  supplier_id,
  id,
  'Polykar. Products: recycled garbage bags, compostable packaging, food-approved bags, industrial flexible film. Notes: Strong focus on sustainable and recycled flexible packaging.',
  jsonb_build_object(
    'source', 'example_seed',
    'company_name', 'Polykar',
    'website', 'https://www.polykar.com/'
  )
from inserted_capability;

with inserted_supplier as (
  insert into public.suppliers (
    name,
    website,
    contact_url,
    country,
    notes
  )
  select
    'Gemma Plastics',
    'https://gemmaplastics.com/',
    'https://gemmaplastics.com/contact/',
    'Canada',
    'Edmonton-based manufacturer with 24-hour production capabilities for industrial applications.'
  where not exists (
    select 1 from public.suppliers where name = 'Gemma Plastics'
  )
  returning id
), resolved_supplier as (
  select id from inserted_supplier
  union all
  select id from public.suppliers where name = 'Gemma Plastics' limit 1
), inserted_capability as (
  insert into public.supplier_capabilities (
    supplier_id,
    capability_type,
    description,
    regions_served
  )
  select
    id,
    'engineered resin and molded components',
    'Engineered resin components; Rubber molded parts; Custom injection molded prototypes; Cast plastic products.',
    array['Canada']
  from resolved_supplier
  returning id, supplier_id
)
insert into public.supplier_search_documents (
  supplier_id,
  capability_id,
  document_text,
  metadata
)
select
  supplier_id,
  id,
  'Gemma Plastics. Products: engineered resin components, rubber molded parts, custom injection molded prototypes, cast plastic products. Notes: Edmonton-based manufacturer with 24-hour production capability.',
  jsonb_build_object(
    'source', 'example_seed',
    'company_name', 'Gemma Plastics',
    'website', 'https://gemmaplastics.com/'
  )
from inserted_capability;

with inserted_supplier as (
  insert into public.suppliers (
    name,
    website,
    contact_url,
    country,
    notes
  )
  select
    'Peel Plastics',
    'https://peelplastics.com/',
    'https://peelplastics.com/contact/',
    'Canada',
    'Specializes in high-end flexible packaging for pet food, lawn and garden, and chemical industries.'
  where not exists (
    select 1 from public.suppliers where name = 'Peel Plastics'
  )
  returning id
), resolved_supplier as (
  select id from inserted_supplier
  union all
  select id from public.suppliers where name = 'Peel Plastics' limit 1
), inserted_capability as (
  insert into public.supplier_capabilities (
    supplier_id,
    capability_type,
    description,
    regions_served
  )
  select
    id,
    'custom printed flexible packaging',
    'Flexible pouches; Side-gusset bags; Custom printed packaging; Sustainable laminate films.',
    array['Canada']
  from resolved_supplier
  returning id, supplier_id
)
insert into public.supplier_search_documents (
  supplier_id,
  capability_id,
  document_text,
  metadata
)
select
  supplier_id,
  id,
  'Peel Plastics. Products: flexible pouches, side-gusset bags, custom printed packaging, sustainable laminate films. Notes: High-end flexible packaging across pet food, lawn and garden, and chemicals.',
  jsonb_build_object(
    'source', 'example_seed',
    'company_name', 'Peel Plastics',
    'website', 'https://peelplastics.com/'
  )
from inserted_capability;

with inserted_supplier as (
  insert into public.suppliers (
    name,
    website,
    contact_url,
    country,
    notes
  )
  select
    'Plastifab',
    'https://www.plastifab.ca/',
    'https://www.plastifab.ca/contact/',
    'Canada',
    'Experts in extrusion, providing custom profiles for construction and medical industries.'
  where not exists (
    select 1 from public.suppliers where name = 'Plastifab'
  )
  returning id
), resolved_supplier as (
  select id from inserted_supplier
  union all
  select id from public.suppliers where name = 'Plastifab' limit 1
), inserted_capability as (
  insert into public.supplier_capabilities (
    supplier_id,
    capability_type,
    description,
    regions_served
  )
  select
    id,
    'plastic extrusion',
    'Extruded thermoplastic profiles; LED lighting covers; Custom plastic tubes; Retail shelf-lighting systems.',
    array['Canada']
  from resolved_supplier
  returning id, supplier_id
)
insert into public.supplier_search_documents (
  supplier_id,
  capability_id,
  document_text,
  metadata
)
select
  supplier_id,
  id,
  'Plastifab. Products: extruded thermoplastic profiles, LED lighting covers, custom plastic tubes, retail shelf-lighting systems. Notes: Extrusion experts serving construction and medical applications.',
  jsonb_build_object(
    'source', 'example_seed',
    'company_name', 'Plastifab',
    'website', 'https://www.plastifab.ca/'
  )
from inserted_capability;
