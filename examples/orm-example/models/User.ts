import "reflect-metadata";
import * as typeorm from "typeorm";
import { Entity, Column, PrimaryGeneratedColumn, OneToOneJoinColumn, OneToMany } from "@fullstack-one/db";
import Photo from "./Photo";
import Task from "./Task";

export enum Size {
  small,
  medium,
  large
}

export enum Gender {
  male,
  female,
  diverse
}

console.log(Object.entries(Gender));

@Entity()
export default class User extends typeorm.BaseEntity {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column({ gqlType: "String", type: "character varying" })
  public firstname: string;

  @Column({ gqlType: "String", type: "character varying" })
  public lastname: string;

  @OneToOneJoinColumn((type) => Photo, { nullable: true })
  public photo?: Photo;

  @OneToMany((type) => Task, task => task.user)
  public tasks: Task[];

  @Column({ enum: Size, enumName: "Size", nullable: true })
  public size?: Size;

  @Column({ enum: Gender, enumName: "Gender", gqlType: "String", type: "integer", nullable: true })
  public gender?: Gender;
}
