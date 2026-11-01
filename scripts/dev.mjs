process.env.NAYANSETU_DEV='1';
process.env.PORT=process.env.PORT||'5173';
await import('../server/index.mjs');
