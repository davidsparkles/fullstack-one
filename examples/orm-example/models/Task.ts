import "reflect-metadata";
import * as typeorm from "typeorm";
import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from "@fullstack-one/db";
import User from "./User";

@Entity()
export default class Task extends typeorm.BaseEntity {
  @PrimaryGeneratedColumn()
  public id: string;

  @Column({ gqlType: "String", type: "character varying" })
  public title: string;

  @ManyToOne((type) => User)
  public user: User;
}