import aula01 from "./module-01/Academia_Atipica_P1-M1-A1_Slides.html?raw";
import aula02 from "./module-01/Academia_Atipica_P1-M1-A2_Slides.html?raw";
import aula03 from "./module-01/Academia_Atipica_P1-M1-A3_Slides.html?raw";
import aula04 from "./module-02/Academia_Atipica_P1-M2-A4_Slides.html?raw";
import aula05 from "./module-02/Academia_Atipica_P1-M2-A5_Slides.html?raw";
import aula06 from "./module-02/Academia_Atipica_P1-M2-A6_Slides.html?raw";
import aula07 from "./module-02/Academia_Atipica_P1-M2-A7_Slides.html?raw";
import aula08 from "./module-02/Academia_Atipica_P1-M2-A8_Slides.html?raw";
import aula09 from "./module-03/Academia_Atipica_P1-M3-A9_Slides.html?raw";
import aula10 from "./module-03/Academia_Atipica_P1-M3-A10_Slides.html?raw";
import aula11 from "./module-03/Academia_Atipica_P1-M3-A11_Slides.html?raw";
import aula12 from "./module-03/Academia_Atipica_P1-M3-A12_Slides.html?raw";
import aula13 from "./module-03/Academia_Atipica_P1-M3-A13_Slides.html?raw";
import aula14 from "./module-03/Academia_Atipica_P1-M3-A14_Slides.html?raw";
import aula15 from "./module-03/Academia_Atipica_P1-M3-A15_Slides.html?raw";
import aula16 from "./module-03/Academia_Atipica_P1-M3-A16_Slides.html?raw";

const bundledHtml: Record<string, string> = {
  "bundled:module-01/aula-01": aula01,
  "bundled:module-01/aula-02": aula02,
  "bundled:module-01/aula-03": aula03,
  "bundled:module-02/aula-04": aula04,
  "bundled:module-02/aula-05": aula05,
  "bundled:module-02/aula-06": aula06,
  "bundled:module-02/aula-07": aula07,
  "bundled:module-02/aula-08": aula08,
  "bundled:module-03/aula-09": aula09,
  "bundled:module-03/aula-10": aula10,
  "bundled:module-03/aula-11": aula11,
  "bundled:module-03/aula-12": aula12,
  "bundled:module-03/aula-13": aula13,
  "bundled:module-03/aula-14": aula14,
  "bundled:module-03/aula-15": aula15,
  "bundled:module-03/aula-16": aula16,
};

export function bundledAcademyHtml(key: string) {
  return bundledHtml[key] ?? null;
}
