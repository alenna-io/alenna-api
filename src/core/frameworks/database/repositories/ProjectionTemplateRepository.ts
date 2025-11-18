import { IProjectionTemplateRepository, ProjectionTemplate, ProjectionTemplateSubject } from '../../../adapters_interface/repositories/IProjectionTemplateRepository';
import prisma from '../prisma.client';

export class ProjectionTemplateRepository implements IProjectionTemplateRepository {
  async findById(id: string, schoolId: string): Promise<ProjectionTemplate | null> {
    const template = await prisma.projectionTemplate.findFirst({
      where: {
        id,
        schoolId,
        deletedAt: null,
      },
      include: {
        templateSubjects: {
          include: {
            subSubject: {
              include: {
                category: true,
                level: true,
              },
            },
          },
          orderBy: {
            order: 'asc',
          },
        },
      },
    });

    if (!template) return null;

    return this.mapToDomain(template);
  }

  async findBySchoolId(schoolId: string): Promise<ProjectionTemplate[]> {
    const templates = await prisma.projectionTemplate.findMany({
      where: {
        schoolId,
        deletedAt: null,
      },
      include: {
        templateSubjects: {
          include: {
            subSubject: {
              include: {
                category: true,
                level: true,
              },
            },
          },
          orderBy: {
            order: 'asc',
          },
        },
      },
      orderBy: [
        { level: 'asc' },
        { isDefault: 'desc' },
        { name: 'asc' },
      ],
    });

    return templates.map(t => this.mapToDomain(t));
  }

  async findByLevel(schoolId: string, level: string): Promise<ProjectionTemplate[]> {
    const templates = await prisma.projectionTemplate.findMany({
      where: {
        schoolId,
        level,
        deletedAt: null,
      },
      include: {
        templateSubjects: {
          include: {
            subSubject: {
              include: {
                category: true,
                level: true,
              },
            },
          },
          orderBy: {
            order: 'asc',
          },
        },
      },
      orderBy: [
        { isDefault: 'desc' },
        { name: 'asc' },
      ],
    });

    return templates.map(t => this.mapToDomain(t));
  }

  async findDefaultByLevel(schoolId: string, level: string): Promise<ProjectionTemplate | null> {
    const template = await prisma.projectionTemplate.findFirst({
      where: {
        schoolId,
        level,
        isDefault: true,
        isActive: true,
        deletedAt: null,
      },
      include: {
        templateSubjects: {
          include: {
            subSubject: {
              include: {
                category: true,
                level: true,
              },
            },
          },
          orderBy: {
            order: 'asc',
          },
        },
      },
    });

    if (!template) return null;

    return this.mapToDomain(template);
  }

  async create(template: Omit<ProjectionTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<ProjectionTemplate> {
    const created = await prisma.projectionTemplate.create({
      data: {
        name: template.name,
        level: template.level,
        isDefault: template.isDefault,
        isActive: template.isActive,
        schoolId: template.schoolId,
        templateSubjects: {
          create: template.templateSubjects.map(subject => ({
            subSubjectId: subject.subSubjectId,
            startPace: subject.startPace,
            endPace: subject.endPace,
            skipPaces: subject.skipPaces,
            notPairWith: subject.notPairWith,
            extendToNext: subject.extendToNext,
            order: subject.order,
          })),
        },
      },
      include: {
        templateSubjects: {
          include: {
            subSubject: {
              include: {
                category: true,
                level: true,
              },
            },
          },
          orderBy: {
            order: 'asc',
          },
        },
      },
    });

    return this.mapToDomain(created);
  }

  async update(id: string, schoolId: string, data: Partial<ProjectionTemplate>): Promise<ProjectionTemplate> {
    // First, delete existing template subjects if we're updating them
    if (data.templateSubjects) {
      await prisma.projectionTemplateSubject.deleteMany({
        where: {
          templateId: id,
        },
      });
    }

    const updated = await prisma.projectionTemplate.update({
      where: {
        id,
        schoolId,
        deletedAt: null,
      },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.level !== undefined && { level: data.level }),
        ...(data.isDefault !== undefined && { isDefault: data.isDefault }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(data.templateSubjects && {
          templateSubjects: {
            create: data.templateSubjects.map(subject => ({
              subSubjectId: subject.subSubjectId,
              startPace: subject.startPace,
              endPace: subject.endPace,
              skipPaces: subject.skipPaces,
              notPairWith: subject.notPairWith,
              extendToNext: subject.extendToNext,
              order: subject.order,
            })),
          },
        }),
      },
      include: {
        templateSubjects: {
          include: {
            subSubject: {
              include: {
                category: true,
                level: true,
              },
            },
          },
          orderBy: {
            order: 'asc',
          },
        },
      },
    });

    return this.mapToDomain(updated);
  }

  async delete(id: string, schoolId: string): Promise<void> {
    await prisma.projectionTemplate.update({
      where: {
        id,
        schoolId,
        deletedAt: null,
      },
      data: {
        deletedAt: new Date(),
      },
    });
  }

  private mapToDomain(template: any): ProjectionTemplate {
    return {
      id: template.id,
      name: template.name,
      level: template.level,
      isDefault: template.isDefault,
      isActive: template.isActive,
      schoolId: template.schoolId,
      templateSubjects: template.templateSubjects.map((ts: any): ProjectionTemplateSubject => ({
        id: ts.id,
        subSubjectId: ts.subSubjectId,
        subSubjectName: ts.subSubject.name,
        startPace: ts.startPace,
        endPace: ts.endPace,
        skipPaces: ts.skipPaces,
        notPairWith: ts.notPairWith,
        extendToNext: ts.extendToNext,
        order: ts.order,
      })),
      createdAt: template.createdAt,
      updatedAt: template.updatedAt,
    };
  }
}

