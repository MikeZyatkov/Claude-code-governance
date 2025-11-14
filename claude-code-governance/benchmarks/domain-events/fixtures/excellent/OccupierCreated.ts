import { EventBase } from 'es-aggregates'

export class OccupierCreated extends EventBase {
  public static readonly typename = 'OccupierCreated'

  constructor(
    public readonly id: string,
    public readonly operatorAccountId: string,
    public readonly occupierName: string,
    public readonly intelligenceEnabled: boolean,
    public readonly billingSiteId: string | null,
    public readonly createdBy: string
  ) {
    super(OccupierCreated.typename)
  }
}
