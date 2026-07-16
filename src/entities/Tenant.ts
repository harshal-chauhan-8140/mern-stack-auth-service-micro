import {
    Column,
    CreateDateColumn,
    Entity,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from "typeorm"

@Entity({
    name: "tenants",
})
export class Tenant {
    @PrimaryGeneratedColumn()
    id!: number

    @Column("varchar", { length: 30 })
    name!: string

    @Column()
    address!: string

    @ManyToOne(() => Tenant)
    tenant!: Tenant

    @UpdateDateColumn()
    updatedAt!: number

    @CreateDateColumn()
    createdAt!: number
}
