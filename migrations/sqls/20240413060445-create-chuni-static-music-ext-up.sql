CREATE TABLE actaeon_chuni_static_music_ext (
    songId INT NOT NULL,
    chartId INT NOT NULL,

    chartDesigner VARCHAR(255),
    tapJudgeCount INT NOT NULL,
    holdJudgeCount INT NOT NULL,
    slideJudgeCount INT NOT NULL,
    airJudgeCount INT NOT NULL,
    flickJudgeCount INT NOT NULL,
    allJudgeCount INT NOT NULL,

    PRIMARY KEY (songId, chartId)
);
