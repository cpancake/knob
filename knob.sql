CREATE EXTENSION IF NOT EXISTS plpgsql WITH SCHEMA pg_catalog;

COMMENT ON EXTENSION plpgsql IS 'PL/pgSQL procedural language';

SET search_path = public, pg_catalog;
SET default_tablespace = '';
SET default_with_oids = false;

CREATE TABLE flash_info (
    id integer NOT NULL,
    postid integer,
    width integer,
    height integer
);

CREATE SEQUENCE flash_info_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE flash_info_id_seq OWNED BY flash_info.id;

CREATE TABLE post (
    id integer NOT NULL,
    hash text,
    uploader integer,
    approver integer,
    remote boolean,
    remote_url text,
    date bigint,
    handler text,
    file text,
    tags integer[] DEFAULT '{}'::integer[]
);

CREATE SEQUENCE post_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE post_id_seq OWNED BY post.id;

CREATE TABLE roles (
    id integer NOT NULL,
    name text,
    color text
);

CREATE TABLE tag (
    id integer NOT NULL,
    name text
);

CREATE SEQUENCE tag_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE tag_id_seq OWNED BY tag.id;

CREATE TABLE tag_revisions (
    postid integer,
    id integer NOT NULL,
    tags integer[],
    userid integer
);

CREATE SEQUENCE tag_revisions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE tag_revisions_id_seq OWNED BY tag_revisions.id;

CREATE TABLE "user" (
    id integer NOT NULL,
    password text,
    role integer DEFAULT 0,
    date bigint,
    nickname text
);

CREATE SEQUENCE user_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE user_id_seq OWNED BY "user".id;

ALTER TABLE ONLY flash_info ALTER COLUMN id SET DEFAULT nextval('flash_info_id_seq'::regclass);

ALTER TABLE ONLY post ALTER COLUMN id SET DEFAULT nextval('post_id_seq'::regclass);

ALTER TABLE ONLY tag ALTER COLUMN id SET DEFAULT nextval('tag_id_seq'::regclass);

ALTER TABLE ONLY tag_revisions ALTER COLUMN id SET DEFAULT nextval('tag_revisions_id_seq'::regclass);

ALTER TABLE ONLY "user" ALTER COLUMN id SET DEFAULT nextval('user_id_seq'::regclass);

COPY roles (id, name, color) FROM stdin;
0	User	white
1	Moderator	#4ec400
2	Admin	#d90000
\.

ALTER TABLE ONLY post
    ADD CONSTRAINT post_pkey PRIMARY KEY (id);

ALTER TABLE ONLY roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);

ALTER TABLE ONLY tag
    ADD CONSTRAINT tag_pkey PRIMARY KEY (id);

ALTER TABLE ONLY tag_revisions
    ADD CONSTRAINT tag_revisions_pkey PRIMARY KEY (id);

ALTER TABLE ONLY "user"
    ADD CONSTRAINT user_pkey PRIMARY KEY (id);