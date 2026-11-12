/**
 * Anel de um município, achatado em `[lon, lat, lon, lat, …]` com três casas
 * decimais (~110 m). A forma plana não é economia à toa: são 645 municípios e
 * quase 11 mil vértices, e a representação em objetos multiplicaria o arquivo.
 */
export type FlatRing = number[]

/** `[nome, latitude, longitude, [latMin, lonMin, latMax, lonMax], anéis]`. */
export type CityEntry = [string, number, number, [number, number, number, number], FlatRing[]]
