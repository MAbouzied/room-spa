import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import { contentSchemaTypes, staffAccessSchemaTypes } from './schemaTypes';

export default defineConfig([
  {
    name: 'room-spa-content',
    title: 'Room Spa Blog',
    basePath: '/content',
    projectId: 'nzy22u9z',
    dataset: 'production',
    plugins: [structureTool()],
    schema: {
      types: contentSchemaTypes,
    },
  },
  {
    name: 'room-spa-staff-access',
    title: 'Room Spa Staff Access',
    basePath: '/staff-auth',
    projectId: 'nzy22u9z',
    dataset: 'staff-auth',
    plugins: [structureTool()],
    schema: {
      types: staffAccessSchemaTypes,
    },
  },
]);
