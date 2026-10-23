-- The team can turn an article off without deleting it: its memory stays, but the agents
-- do not use it until it is turned on again.
alter table documents add column active boolean not null default true;

-- The documents each page was built from, to forget the page when one is turned off or
-- deleted. Null for pages built before this was recorded: they are forgotten too.
alter table pages add column document_ids uuid[];
