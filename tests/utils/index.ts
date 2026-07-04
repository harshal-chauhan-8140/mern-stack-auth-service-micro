import type { DataSource } from "typeorm"

export const truncatTables = async (connection: DataSource) => {
    const entities = connection.entityMetadatas

    for (const entity of entities) {
        const repository = connection.getRepository(entity.name)
        repository.clear()
    }
}
