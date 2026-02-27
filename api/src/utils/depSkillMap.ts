/**
 * Curated mapping from dependency/package names to skill labels.
 * These labels should match ESCO preferred_labels or alt_labels.
 * Used for high-confidence dependency→skill evidence extraction.
 */
export const DEP_SKILL_MAP: Record<string, string[]> = {
  // JavaScript/TypeScript
  react: ['React', 'JavaScript'],
  'react-dom': ['React', 'JavaScript'],
  'react-native': ['React Native', 'JavaScript'],
  'next': ['Next.js', 'React', 'JavaScript'],
  'nuxt': ['Vue.js', 'JavaScript'],
  vue: ['Vue.js', 'JavaScript'],
  angular: ['Angular', 'TypeScript'],
  svelte: ['Svelte', 'JavaScript'],
  typescript: ['TypeScript', 'JavaScript'],
  webpack: ['webpack', 'JavaScript'],
  vite: ['Vite', 'JavaScript'],
  eslint: ['JavaScript'],
  jest: ['JavaScript', 'software testing'],
  mocha: ['JavaScript', 'software testing'],
  express: ['Express.js', 'Node.js'],
  fastify: ['Node.js', 'JavaScript'],
  koa: ['Node.js', 'JavaScript'],
  'socket.io': ['WebSocket', 'Node.js'],
  graphql: ['GraphQL'],
  apollo: ['GraphQL'],
  redux: ['React', 'JavaScript'],
  mobx: ['React', 'JavaScript'],
  prisma: ['SQL', 'database management'],
  sequelize: ['SQL', 'Node.js'],
  mongoose: ['MongoDB', 'Node.js'],
  axios: ['JavaScript', 'REST API'],
  lodash: ['JavaScript'],
  rxjs: ['JavaScript', 'TypeScript'],
  electron: ['Electron', 'JavaScript'],
  // Python
  django: ['Django', 'Python', 'web development'],
  flask: ['Flask', 'Python'],
  fastapi: ['FastAPI', 'Python'],
  pytest: ['Python', 'software testing'],
  numpy: ['NumPy', 'Python', 'data analysis'],
  pandas: ['pandas', 'Python', 'data analysis'],
  scipy: ['Python', 'data analysis', 'statistics'],
  matplotlib: ['Python', 'data visualisation'],
  seaborn: ['Python', 'data visualisation'],
  sklearn: ['scikit-learn', 'machine learning', 'Python'],
  'scikit-learn': ['scikit-learn', 'machine learning', 'Python'],
  tensorflow: ['TensorFlow', 'machine learning', 'Python'],
  keras: ['Keras', 'machine learning', 'Python'],
  torch: ['PyTorch', 'machine learning', 'Python'],
  pytorch: ['PyTorch', 'machine learning', 'Python'],
  transformers: ['machine learning', 'Python', 'natural language processing'],
  celery: ['Python', 'message queue'],
  sqlalchemy: ['SQLAlchemy', 'Python', 'SQL'],
  alembic: ['Python', 'SQL'],
  pydantic: ['Python', 'TypeScript'],
  requests: ['Python', 'REST API'],
  aiohttp: ['Python', 'asynchronous programming'],
  scrapy: ['Python', 'web scraping'],
  // Java / JVM
  'spring-boot': ['Spring Boot', 'Java'],
  'spring-framework': ['Spring Framework', 'Java'],
  hibernate: ['Hibernate', 'Java', 'SQL'],
  maven: ['Maven', 'Java'],
  gradle: ['Gradle', 'Java'],
  junit: ['Java', 'software testing'],
  kafka: ['Apache Kafka', 'message queue'],
  'apache-kafka': ['Apache Kafka', 'message queue'],
  flink: ['Apache Flink', 'data processing'],
  spark: ['Apache Spark', 'data processing'],
  // Go
  gin: ['Go', 'web development'],
  echo: ['Go', 'web development'],
  fiber: ['Go', 'web development'],
  grpc: ['gRPC', 'REST API'],
  // Rust
  actix: ['Rust', 'web development'],
  tokio: ['Rust', 'asynchronous programming'],
  serde: ['Rust'],
  // Databases
  pg: ['PostgreSQL', 'SQL'],
  'pg-pool': ['PostgreSQL', 'SQL'],
  mysql2: ['MySQL', 'SQL'],
  redis: ['Redis', 'database management'],
  mongodb: ['MongoDB', 'database management'],
  elasticsearch: ['Elasticsearch'],
  // DevOps / Cloud
  docker: ['Docker', 'containerisation'],
  kubernetes: ['Kubernetes', 'containerisation'],
  terraform: ['Terraform', 'infrastructure as code'],
  ansible: ['Ansible', 'infrastructure as code'],
  pulumi: ['Pulumi', 'infrastructure as code'],
  // Testing
  cypress: ['Cypress', 'software testing'],
  playwright: ['Playwright', 'software testing'],
  selenium: ['Selenium', 'software testing'],
  // Data / ML
  airflow: ['Apache Airflow', 'data pipeline'],
  dbt: ['dbt', 'data pipeline'],
  'great-expectations': ['data quality'],
  mlflow: ['MLflow', 'machine learning'],
  // Frontend specifics
  tailwindcss: ['Tailwind CSS', 'CSS'],
  sass: ['Sass', 'CSS'],
  'styled-components': ['CSS-in-JS', 'React'],
  'framer-motion': ['React', 'animation'],
  recharts: ['React', 'data visualisation'],
  d3: ['D3.js', 'data visualisation'],
};

/** Normalize a package name for lookup */
export function normalizeDep(name: string): string {
  return name.toLowerCase().replace(/^@[\w-]+\//, '');
}

/** Get skills for a dependency name */
export function getSkillsForDep(depName: string): string[] {
  const normalized = normalizeDep(depName);
  return DEP_SKILL_MAP[normalized] ?? [];
}
