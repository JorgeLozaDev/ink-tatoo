const CONF = {
  DDBB_URL: process.env.DDBB_URL!,
  DDBB_NAME: process.env.DDBB_NAME!,
  BCRYTP_LOOP: parseInt(process.env.BCRYTP_LOOP!, 10),
  JWT_SECRET: process.env.JWT_SECRET!,
};

export = CONF;
