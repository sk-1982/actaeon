import { sql } from 'kysely';

export const chuniRating = (score: any = sql.raw(`CAST(score.scoreMax AS INT)`),
                            level: any = sql.raw(`(CAST(music.level AS DECIMAL(3, 1)) * 100)`)) => sql<string>`
CAST(GREATEST((CASE
    WHEN ${score} IS NULL THEN NULL
    WHEN ${score} >= 1009000 THEN ${level} + 215
    WHEN ${score} >= 1007500 THEN ${level} + 200 + (${score} - 1007500) / 100
    WHEN ${score} >= 1005000 THEN ${level} + 150 + (${score} - 1005000) / 50
    WHEN ${score} >= 1000000 THEN ${level} + 100 + (${score} - 1000000) / 100
    WHEN ${score} >=  975000 THEN ${level} +       (${score} -  975000) / 250
    WHEN ${score} >=  900000 THEN ${level} - 500 + (${score} -  900000) / 150
    WHEN ${score} >=  800000 THEN (${level} - 500) / 2 + (${score} - 800000) * ((${level} - 500) / 2) / 100000
    WHEN ${score} >=  500000 THEN ((${level} - 500) / 2 * (${score} - 500000)) / 300000
    ELSE 0 END) / 100, 0) AS DECIMAL(10, 8))
`.as('rating');
