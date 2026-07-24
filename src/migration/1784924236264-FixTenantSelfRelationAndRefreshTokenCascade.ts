import type { MigrationInterface, QueryRunner } from "typeorm"

export class FixTenantSelfRelationAndRefreshTokenCascade1784924236264 implements MigrationInterface {
    name = "FixTenantSelfRelationAndRefreshTokenCascade1784924236264"

    public async up(queryRunner: QueryRunner): Promise<void> {
        // The Tenant entity had a stray self-referencing @ManyToOne, which
        // added a tenants.tenantId column that nothing ever used.
        await queryRunner.query(
            `ALTER TABLE "tenants" DROP CONSTRAINT "FK_5d1f2d0d0b5f5c5e1720082ebbd"`,
        )
        await queryRunner.query(`ALTER TABLE "tenants" DROP COLUMN "tenantId"`)

        // Deleting a user who had ever logged in violated this constraint.
        await queryRunner.query(
            `ALTER TABLE "refreshTokens" DROP CONSTRAINT "FK_265bec4e500714d5269580a0219"`,
        )
        await queryRunner.query(
            `ALTER TABLE "refreshTokens" ADD CONSTRAINT "FK_265bec4e500714d5269580a0219" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "refreshTokens" DROP CONSTRAINT "FK_265bec4e500714d5269580a0219"`,
        )
        await queryRunner.query(
            `ALTER TABLE "refreshTokens" ADD CONSTRAINT "FK_265bec4e500714d5269580a0219" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
        )

        await queryRunner.query(`ALTER TABLE "tenants" ADD "tenantId" integer`)
        await queryRunner.query(
            `ALTER TABLE "tenants" ADD CONSTRAINT "FK_5d1f2d0d0b5f5c5e1720082ebbd" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
        )
    }
}
