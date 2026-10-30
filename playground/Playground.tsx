import React, { StrictMode, useState, useCallback, useMemo } from 'react';
import { createRoot } from 'react-dom/client';

import type { ApiSpecType } from '../src/types/common.js';
import type { RawApiDocsOptions } from '../src/types/options.js';

import './index.css';
import RedocStandalone from '../src/RedocStandalone.js';
import { apiSpecType } from '../src/types/common.js';
const BASE_PATH = '/docs';

type SpecEntry = {
  label: string;
  path?: string;
  type: ApiSpecType;
  /** Text of a file uploaded in the browser; `path` is then unset. */
  content?: string;
};

const UPLOAD_EXTENSIONS = '.yaml,.yml,.json,.graphql,.gql';

/** AsyncAPI and OpenAPI share YAML/JSON syntax, so the root key decides; GraphQL is extension-based. */
function detectSpecType(fileName: string, content: string): ApiSpecType {
  const extension = fileName.slice(fileName.lastIndexOf('.')).toLowerCase();
  if (extension === '.graphql' || extension === '.gql') return apiSpecType.GRAPHQL;
  if (/^\s*(?:---\s*)?asyncapi\s*:/m.test(content)) return apiSpecType.ASYNCAPI;
  return apiSpecType.OPENAPI;
}

const SPECS: SpecEntry[] = [
  {
    label: 'Cafe',
    path: '/specs/cafe.yaml',
    type: apiSpecType.OPENAPI,
  },
  {
    label: 'Cafe Orders (Kafka)',
    path: '/specs/cafe-asyncapi-kafka.yaml',
    type: apiSpecType.ASYNCAPI,
  },
  {
    label: 'Cafe Telemetry (MQTT)',
    path: '/specs/cafe-asyncapi-mqtt.yaml',
    type: apiSpecType.ASYNCAPI,
  },
  {
    label: 'Cafe Kitchen (AMQP)',
    path: '/specs/cafe-asyncapi-amqp.yaml',
    type: apiSpecType.ASYNCAPI,
  },
  {
    label: 'Cafe Live Board (WebSocket)',
    path: '/specs/cafe-asyncapi-websocket.yaml',
    type: apiSpecType.ASYNCAPI,
  },
  {
    label: 'Cafe (GraphQL)',
    path: '/specs/cafe.graphql',
    type: apiSpecType.GRAPHQL,
  },
];

function getOptions(spec: SpecEntry): RawApiDocsOptions {
  return {
    specType: spec.type,
    metadata: { type: spec.type },
    scrollYOffset: 40,
    maxDisplayedEnumValues: 4,
    schemaDefinitionsTagName: 'Schemas',
    jsonSamplesExpandLevel: 1,
    showExtensions: true,
    sortRequiredPropsFirst: true,
    hideSchemaTitles: false,
  };
}

const STORAGE_KEY = 'playground-spec-idx';

/**
 * `?spec=<url>&type=<specType>` points the playground at any definition the dev server can
 * reach, without adding it to the list above — handy for trying your own API, or a large one
 * the shipped demos do not cover.
 */
function getUrlSpec(): SpecEntry | undefined {
  if (typeof window === 'undefined') return undefined;
  const params = new URLSearchParams(window.location.search);
  const path = params.get('spec');
  if (!path) return undefined;
  const type = (params.get('type') ?? apiSpecType.OPENAPI) as ApiSpecType;
  return { label: path.split('/').pop() ?? path, path, type };
}

function getStoredIdx(): number {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored !== null) {
      const idx = Number(stored);
      if (idx >= 0 && idx < SPECS.length) return idx;
    }
  } catch {
    /* SSR / disabled storage */
  }
  return 0;
}

function Playground() {
  const [urlSpec] = useState(getUrlSpec);
  const [uploads, setUploads] = useState<SpecEntry[]>([]);
  const specs = useMemo(
    () => [...SPECS, ...(urlSpec ? [urlSpec] : []), ...uploads],
    [urlSpec, uploads],
  );
  const [selectedIdx, setSelectedIdx] = useState(() =>
    urlSpec ? specs.length - 1 : getStoredIdx(),
  );
  const [loading, setLoading] = useState(true);

  const handleSelect = useCallback((idx: number) => {
    setSelectedIdx(idx);
    setLoading(true);
    try {
      sessionStorage.setItem(STORAGE_KEY, String(idx));
    } catch {
      /* noop */
    }
    window.history.replaceState(null, '', BASE_PATH);
  }, []);

  /** Reads the picked file in the browser and adds it to the dropdown, selected. */
  const handleUpload = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const input = event.target;
      const file = input.files?.[0];
      // Clearing the value lets the same file be picked again after it was edited.
      input.value = '';
      if (!file) return;

      const uploadedIdx = uploads.findIndex((entry) => entry.label === file.name);
      void file.text().then((content) => {
        const entry: SpecEntry = {
          label: file.name,
          type: detectSpecType(file.name, content),
          content,
        };
        setUploads((prev) => {
          const existingIdx = prev.findIndex((item) => item.label === entry.label);
          if (existingIdx === -1) return [...prev, entry];
          const next = [...prev];
          next[existingIdx] = entry;
          return next;
        });
        const base = SPECS.length + (urlSpec ? 1 : 0);
        handleSelect(base + (uploadedIdx === -1 ? uploads.length : uploadedIdx));
      });
    },
    [handleSelect, uploads, urlSpec],
  );

  const handleLoaded = useCallback((error?: Error) => {
    setLoading(false);
    if (error) {
      console.error('Failed to load spec:', error.stack || error);
    }
  }, []);

  const spec = specs[selectedIdx] ?? specs[0];

  return (
    <>
      <div
        style={{
          position: 'sticky',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 10000,
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: 8,
          padding: '6px 16px',
          background: '#1d2d3e',
          borderBottom: '1px solid #2a3f54',
          color: '#fff',
          fontSize: 13,
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <label htmlFor="playground-spec" style={{ fontWeight: 600 }}>
          Spec:
        </label>
        <select
          id="playground-spec"
          value={selectedIdx}
          onChange={(e) => handleSelect(Number(e.target.value))}
          style={{
            padding: '4px 8px',
            borderRadius: 4,
            border: '1px solid #3a5068',
            background: '#0d1b2a',
            color: '#fff',
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          {specs.map((s, i) => (
            <option key={`${s.label}-${i}`} value={i}>
              {s.label} ({s.type})
            </option>
          ))}
        </select>
        <label
          htmlFor="playground-upload"
          style={{
            padding: '4px 10px',
            borderRadius: 4,
            border: '1px solid #3a5068',
            background: '#0d1b2a',
            color: '#fff',
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          Upload file
        </label>
        <input
          id="playground-upload"
          type="file"
          accept={UPLOAD_EXTENSIONS}
          onChange={handleUpload}
          style={{ display: 'none' }}
        />
        {loading && <span style={{ opacity: 0.6 }}>Loading...</span>}
      </div>
      <RedocStandalone
        key={selectedIdx}
        spec={spec.content}
        specUrl={spec.path}
        options={getOptions(spec)}
        basePath={BASE_PATH}
        onLoaded={handleLoaded}
        logo={{
          url: '/redoc-logo.svg',
          href: 'https://github.com/Redocly/redoc/',
          altText: 'Redoc logo',
        }}
      />
    </>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Playground />
  </StrictMode>,
);
