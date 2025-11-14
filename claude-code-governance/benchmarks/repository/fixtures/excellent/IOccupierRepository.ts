import { IRepository } from 'es-aggregates'
import { Occupier } from '../model/Occupier.aggregate'

/**
 * @description Defines the contract for persisting and retrieving Occupier aggregates.
 */
export interface IOccupierRepository extends IRepository<Occupier> {}
