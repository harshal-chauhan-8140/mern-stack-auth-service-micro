import type { MigrationInterface, QueryRunner } from "typeorm"

export class AddForiegnKeyTenantIdInUsersTable1784208864968 implements MigrationInterface {
    name = "AddForiegnKeyTenantIdInUsersTable1784208864968"

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tenants" ADD "tenantId" integer`)
        await queryRunner.query(
            `ALTER TABLE "tenants" ADD CONSTRAINT "FK_5d1f2d0d0b5f5c5e1720082ebbd" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
        )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "tenants" DROP CONSTRAINT "FK_5d1f2d0d0b5f5c5e1720082ebbd"`,
        )
        await queryRunner.query(`ALTER TABLE "tenants" DROP COLUMN "tenantId"`)
    }
}
