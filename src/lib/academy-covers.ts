import module01 from "@/assets/academy-covers/modulo_01_capa.png.asset.json";
import module02 from "@/assets/academy-covers/modulo_02_capa.png.asset.json";
import module03 from "@/assets/academy-covers/modulo_03_capa.png.asset.json";
import lesson01 from "@/assets/academy-covers/aula_01_capa.png.asset.json";
import lesson02 from "@/assets/academy-covers/aula_02_capa.png.asset.json";
import lesson03 from "@/assets/academy-covers/aula_03_capa.png.asset.json";
import lesson04 from "@/assets/academy-covers/aula_04_capa.png.asset.json";
import lesson05 from "@/assets/academy-covers/aula_05_capa.png.asset.json";
import lesson06 from "@/assets/academy-covers/aula_06_capa.png.asset.json";
import lesson07 from "@/assets/academy-covers/aula_07_capa.png.asset.json";
import lesson08 from "@/assets/academy-covers/aula_08_capa.png.asset.json";
import lesson09 from "@/assets/academy-covers/aula_09_capa.png.asset.json";
import lesson10 from "@/assets/academy-covers/aula_10_capa.png.asset.json";
import lesson11 from "@/assets/academy-covers/aula_11_capa.png.asset.json";
import lesson12 from "@/assets/academy-covers/aula_12_capa.png.asset.json";
import lesson13 from "@/assets/academy-covers/aula_13_capa.png.asset.json";
import lesson14 from "@/assets/academy-covers/aula_14_capa.png.asset.json";
import lesson15 from "@/assets/academy-covers/aula_15_capa.png.asset.json";
import lesson16 from "@/assets/academy-covers/aula_16_capa.png.asset.json";

const moduleCovers = [module01.url, module02.url, module03.url] as const;
const lessonCovers = [
  lesson01.url,
  lesson02.url,
  lesson03.url,
  lesson04.url,
  lesson05.url,
  lesson06.url,
  lesson07.url,
  lesson08.url,
  lesson09.url,
  lesson10.url,
  lesson11.url,
  lesson12.url,
  lesson13.url,
  lesson14.url,
  lesson15.url,
  lesson16.url,
] as const;

const lessonTitles = [
  "Comunicação e interação social",
  "Estereotipias e comportamentos repetitivos",
  "Alterações sensoriais",
  "O que a bioquímica investiga",
  "Inflamação",
  "Problemas intestinais no autismo",
  "A relação intestino-cérebro",
  "Permeabilidade intestinal",
  "Inflamação, permeabilidade e condições relacionadas",
  "Disfunção mitocondrial",
  "Polimorfismos genéticos",
  "Estresse oxidativo",
  "Deficiências nutricionais",
  "A importância dos nutrientes",
  "PANS/PANDAS",
  "Síndrome fúngica",
] as const;

function normalizeTitle(value: string) {
  return value
    .toLocaleLowerCase("pt-BR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

const lessonCoverByTitle = new Map(
  lessonTitles.map((title, index) => [normalizeTitle(title), lessonCovers[index]]),
);

export function getAcademyModuleCover(position: number) {
  return moduleCovers[position] ?? null;
}

export function getAcademyLessonCover(title: string) {
  const normalized = normalizeTitle(title);
  const exact = lessonCoverByTitle.get(normalized);
  if (exact) return exact;
  const match = [...lessonCoverByTitle.entries()].find(
    ([candidate]) => normalized.includes(candidate) || candidate.includes(normalized),
  );
  return match?.[1] ?? null;
}