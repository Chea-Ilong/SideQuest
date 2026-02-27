-- Seed data: target role templates for gap analysis
-- Skills array format: [{esco_uri, preferred_label, weight}]
-- Weight 0-1: importance of this skill for the role (1.0 = essential)

INSERT INTO ref.target_roles (id, name, description, skills) VALUES
(
  'frontend-eng',
  'Frontend Engineer',
  'Builds user interfaces and client-side web applications',
  '[
    {"preferred_label": "JavaScript", "weight": 1.0},
    {"preferred_label": "React", "weight": 0.9},
    {"preferred_label": "HTML", "weight": 0.9},
    {"preferred_label": "CSS", "weight": 0.9},
    {"preferred_label": "TypeScript", "weight": 0.8},
    {"preferred_label": "web accessibility", "weight": 0.7},
    {"preferred_label": "responsive web design", "weight": 0.7},
    {"preferred_label": "Git", "weight": 0.8},
    {"preferred_label": "REST API", "weight": 0.7},
    {"preferred_label": "testing", "weight": 0.6}
  ]'::jsonb
),
(
  'backend-eng',
  'Backend Engineer',
  'Builds server-side applications and APIs',
  '[
    {"preferred_label": "Node.js", "weight": 0.9},
    {"preferred_label": "Python", "weight": 0.8},
    {"preferred_label": "SQL", "weight": 0.9},
    {"preferred_label": "REST API", "weight": 0.9},
    {"preferred_label": "database management", "weight": 0.8},
    {"preferred_label": "Git", "weight": 0.8},
    {"preferred_label": "Docker", "weight": 0.7},
    {"preferred_label": "security", "weight": 0.7},
    {"preferred_label": "testing", "weight": 0.7},
    {"preferred_label": "cloud computing", "weight": 0.6}
  ]'::jsonb
),
(
  'fullstack-eng',
  'Fullstack Engineer',
  'Works across both frontend and backend systems',
  '[
    {"preferred_label": "JavaScript", "weight": 1.0},
    {"preferred_label": "TypeScript", "weight": 0.8},
    {"preferred_label": "React", "weight": 0.85},
    {"preferred_label": "Node.js", "weight": 0.85},
    {"preferred_label": "SQL", "weight": 0.8},
    {"preferred_label": "REST API", "weight": 0.9},
    {"preferred_label": "Git", "weight": 0.9},
    {"preferred_label": "Docker", "weight": 0.6},
    {"preferred_label": "CSS", "weight": 0.7},
    {"preferred_label": "testing", "weight": 0.7}
  ]'::jsonb
),
(
  'data-eng',
  'Data Engineer',
  'Builds data pipelines, storage and processing infrastructure',
  '[
    {"preferred_label": "Python", "weight": 1.0},
    {"preferred_label": "SQL", "weight": 1.0},
    {"preferred_label": "Apache Spark", "weight": 0.8},
    {"preferred_label": "data pipeline", "weight": 0.9},
    {"preferred_label": "cloud computing", "weight": 0.8},
    {"preferred_label": "Docker", "weight": 0.7},
    {"preferred_label": "data modelling", "weight": 0.8},
    {"preferred_label": "Git", "weight": 0.7},
    {"preferred_label": "data warehousing", "weight": 0.7},
    {"preferred_label": "Kafka", "weight": 0.6}
  ]'::jsonb
),
(
  'ml-eng',
  'ML Engineer',
  'Builds and deploys machine learning models and systems',
  '[
    {"preferred_label": "Python", "weight": 1.0},
    {"preferred_label": "machine learning", "weight": 1.0},
    {"preferred_label": "TensorFlow", "weight": 0.8},
    {"preferred_label": "PyTorch", "weight": 0.8},
    {"preferred_label": "data analysis", "weight": 0.9},
    {"preferred_label": "SQL", "weight": 0.7},
    {"preferred_label": "Docker", "weight": 0.7},
    {"preferred_label": "cloud computing", "weight": 0.7},
    {"preferred_label": "Git", "weight": 0.8},
    {"preferred_label": "statistics", "weight": 0.8}
  ]'::jsonb
)
ON CONFLICT (id) DO NOTHING;
