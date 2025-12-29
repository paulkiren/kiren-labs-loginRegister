import { Controller, Get, Patch, Delete, Param, Body, UseGuards, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UserProfileService } from './services/user-profile.service';
import { UpdateUserDto } from './dto';
import { JwtAuthGuard } from '../identity/guards/jwt-auth.guard';
import { CurrentUser } from '../identity/decorators/current-user.decorator';

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UserProfileController {
  constructor(private readonly userService: UserProfileService) {}

  @Get()
  @ApiOperation({ summary: 'List users' })
  async findAll() {
    const users = await this.userService.findAll();
    return { users, count: users.length };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by id' })
  async findOne(@Param('id') id: string) {
    const user = await this.userService.findById(id);
    return { user };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update user (self-service)' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() currentUser: any,
  ) {
    if (currentUser.sub !== id) {
      throw new ForbiddenException('You can only update your own profile');
    }
    const user = await this.userService.update(id, dto);
    return { user };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete user (self-service)' })
  async remove(@Param('id') id: string, @CurrentUser() currentUser: any) {
    if (currentUser.sub !== id) {
      throw new ForbiddenException('You can only delete your own account');
    }
    await this.userService.delete(id);
    return { message: 'User deleted successfully' };
  }
}
