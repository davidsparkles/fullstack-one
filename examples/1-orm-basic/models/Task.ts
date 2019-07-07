import { BaseEntity, Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from "@fullstack-one/db";

@Entity()
export default class Task extends BaseEntity {
  @PrimaryGeneratedColumn()
  public id: string;

  @CreateDateColumn()
  public readonly createdAt!: string; // @createdAt

  @UpdateDateColumn()
  public readonly updatedAt!: string; // @updatedAt

  @Column({ gqlType: "String", type: "character varying" })
  public title: string;
}