from django.db import migrations

def crear_roles_iniciales(apps, schema_editor):
    Group = apps.get_model('auth', 'Group')
    
    roles = ['Comandante', 'Subordinado', 'Secretaria']
    
    for nombre_rol in roles:
        Group.objects.get_or_create(name=nombre_rol)

class Migration(migrations.Migration):

    dependencies = [
        ('users', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(crear_roles_iniciales),
    ]