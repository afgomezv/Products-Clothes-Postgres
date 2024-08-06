import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { PaginationDto } from 'src/common/dtos/pagination.dto';
import {validate as isUUID} from 'uuid'

@Injectable()
export class ProductsService {

  private readonly logger = new Logger('ProductsService')

  constructor(
    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,
  ){}

  async create(createProductDto: CreateProductDto) {

    try {

      const product = this.productsRepository.create(createProductDto);
      await this.productsRepository.save(product);

      return product
      
    } catch (error) {
      //console.log(error);
      this.handleDBExection(error)
    }
  }

  findAll(paginationDto: PaginationDto) {

    const { limit= 10, offsett = 0 } = paginationDto


    return this.productsRepository.find({
      take: limit,
      skip: offsett,
      // todo: relaciones
    });
  }

  async findOne(term: string) {

    let product: Product;

    if(isUUID(term)){
      product = await this.productsRepository.findOneBy({id: term})
    }else{
      const queryBuilder = this.productsRepository.createQueryBuilder()
      product = await queryBuilder
        .where('UPPER(title) =:title or slug=:slug', {
          title: term.toUpperCase(),
          slug: term.toLowerCase()
        }).getOne()
    }

    if(!product)
      throw new NotFoundException(`Product with ${term} not found`)


    return product;
  }

  async update(id: string, updateProductDto: UpdateProductDto) {

    const product = await this.productsRepository.preload({
      id: id,
      ...updateProductDto
    })

    if(!product) throw new NotFoundException(`Product with id: ${id} not found`)
    
      try {
        await this.productsRepository.save(product)

        return product
        
      } catch (error) {
        this.handleDBExection(error)
        
      }
  }

  async remove(id: string) {
    const product = await this.findOne(id)
    await this.productsRepository.remove(product)
  }

  private handleDBExection(error: any) {
    if(error.code === '23505') 
      throw new BadRequestException(error.detail)
    
    this.logger.error(error)
    throw new InternalServerErrorException('Unexpected error, check server logs')
  }
}
